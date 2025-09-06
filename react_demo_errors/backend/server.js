require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios"); // Заменяем fetch на axios
const https = require("https");
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = 3001;

// Мидлвары
app.use(cors());
app.use(express.json());

// Ключи из переменных окружения
const GIGA_CLIENT_ID = process.env.GIGA_CLIENT_ID;
const GIGA_CLIENT_SECRET = process.env.GIGA_CLIENT_SECRET;
const GIGA_AUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth";
const GIGA_API_URL =
  "https://gigachat.devices.sberbank.ru/api/v1/chat/completions";
// За генерацию текста и изображений отвечает запрос POST /chat/completions.
// Создаем HTTPS agent с отключенной проверкой SSL (для разработки)
// "В продакшене, конечно, будем использовать валидные сертификаты"
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// ================== МОК-ДОКУМЕНТЫ ==================
const mockDocuments = {
  nexus: {
    title: "Доступ к Nexus для сотрудников",
    url: "https://confluence.bank.ru/pages/nexus-access",
    content: `# Процедура получения доступа к Nexus для сотрудников

    ## Общие положения
    
    Доступ к системе Nexus предоставляется только сотрудникам, прошедшим проверку СБ и подписавшим NDA.
    
    ## Шаг 1: Заявка
    
    - Заполнить форму NX-101 в трех экземплярах
    - Получить визу руководителя отдела
    - Согласовать с отделом информационной безопасности
    
    ## Шаг 2: Обучение
    
    - Пройти онлайн-курс "Безопасность работы в Nexus" (4 часа)
    - Сдать тест на знание политик безопасности
    - Получить сертификат о прохождении обучения
    
    ## Шаг 3: Получение доступа
    
    - Отправить скан подписанной формы NX-101 на email: nexus-access@bank.ru
    - Ожидать письмо с логином и временным паролем (до 5 рабочих дней)
    - При первом входе сменить пароль
    
    ## Важно!
    
    При утере пароля - заполнить форму NX-404 и лично обратиться в ОИБ каб. 304.
    `,
  },
  отпуск: {
    title: "Процедура оформления отпуска",
    url: "https://confluence.bank.ru/pages/vacation-process",
    content: `# Процедура оформления отпуска

    ## Необходимые документы
    
    1. Заявление на отпуск по форме ОТ-202 (2 экз.)
    2. График отпусков отдела (согласованный)
    3. Справка об отсутствии задолженности
    
    ## Согласование (последовательно!)
    
    1. ✅ Непосредственный руководитель
    2. ✅ Начальник отдела кадров
    3. ✅ Финансовый директор
    4. ✅ Зам. председателя правления
    5. ✅ Служба безопасности (проверка на период отпуска)
    6. ✅ Бухгалтерия (расчет отпускных)
    
    ## Сроки
    
    - Подача заявления: не позднее чем за 30 дней до начала отпуска
    - Согласование: до 15 рабочих дней
    - Выплата отпускных: за 3 дня до начала отпуска
    
    ## Особые случаи
    
    - Больничный во время отпуска: форма ОТ-505 + листок нетрудоспособности
    - Перенос отпуска: форма ОТ-606 + объяснительная записка
    `,
  },
  командировка: {
    title: "Порядок оформления командировки",
    url: "https://confluence.bank.ru/pages/business-trip",
    content: `# Порядок оформления командировки

    ## Этап 1: Предварительное согласование
    
    - Заполнить форму КМ-101 "Заявка на командировку"
    - Получить визу руководителя
    - Согласовать с планово-экономическим отделом
    
    ## Этап 2: Бронирование
    
    - Заполнить форму КМ-202 "Заявка на бронирование"
    - Приложить коммерческое предложение (если встреча с клиентом)
    - Согласовать с отдеом закупок
    
    ## Этап 3: Документы
    
    1. Приказ о командировке (форма КМ-303)
    2. Служебное задание (форма КМ-404)
    3. Программа командировки (форма КМ-505)
    
    ## Этап 4: Отчет после командировки
    
    - В течение 3 дней: отчет о результатах (форма КМ-606)
    - В течение 5 дней: авансовый отчет с приложением чеков
    - Возврат неизрасходованных средств в кассу
    
    ## Лимиты
    
    - Гостиница: не более 15000 руб./сутки
    - Питание: не более 20000 руб./сутки
    - Транспорт: бизнес-класс (авиа), купе (ж/д)
    `,
  },
};

// Улучшенная функция поиска
function searchMockDocuments(query) {
  console.log("Поиск запроса:", query);
  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/).filter((word) => word.length > 2);
  const results = [];
  const foundIds = new Set();

  for (const [key, doc] of Object.entries(mockDocuments)) {
    const contentLower = doc.content.toLowerCase();
    const titleLower = doc.title.toLowerCase();

    let relevance = 0;

    // Поиск полной фразы
    if (contentLower.includes(lowerQuery) || titleLower.includes(lowerQuery)) {
      relevance += 10;
    }

    // Поиск по отдельным словам
    for (const word of queryWords) {
      if (titleLower.includes(word)) relevance += 3;
      if (contentLower.includes(word)) relevance += 1;
    }

    console.log(`Документ "${doc.title}": релевантность=${relevance}`);

    if (relevance > 0 && !foundIds.has(key)) {
      foundIds.add(key);
      results.push({ ...doc, relevance });
    }
  }

  // Сортируем по релевантности и берем только самые relevant
  return results
    .sort((a, b) => b.relevance - a.relevance)
    .filter((doc) => doc.relevance >= 2); // Минимальный порог
}

// Кодируем в base64: Client ID:Client Secret
function getAuthHeader() {
  const credentials = `${GIGA_CLIENT_ID}:${GIGA_CLIENT_SECRET}`;
  const base64Credentials = Buffer.from(credentials).toString("base64");
  return `Basic ${base64Credentials}`;
}

// Переменная для кеширования токена
let accessToken = null;
let tokenExpiresAt = 0;

function formatResponse(text) {
  return (
    text
      // Разделяем основные разделы
      .replace(/(## .+)/g, "\n\n$1\n")
      // Разделяем подразделы
      .replace(/(### .+)/g, "\n\n$1\n")
      // Добавляем переносы после маркеров списка
      .replace(/(✅|🔹|❌|•|\d+\.) /g, "\n$1 ")
      // Переносы после предложений
      .replace(/([.!?])( [А-Я])/g, "$1\n$2")
      // Чистим лишние переносы
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
// Функция для получения токена
async function getAccessToken() {
  try {
    console.log("Пытаюсь получить токен...");
    console.log("URL:", GIGA_AUTH_URL);
    console.log("CLIENT_ID есть?:", GIGA_CLIENT_ID ? "да" : "нет");

    const response = await axios.post(
      GIGA_AUTH_URL,
      "scope=GIGACHAT_API_PERS",
      {
        httpsAgent: httpsAgent, // Отключаем проверку SSL
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: getAuthHeader(),
          RqUID: uuidv4(),
        },
      }
    );

    console.log("Статус ответа:", response.status);

    const data = response.data;
    console.log("Данные ответа:", data);

    accessToken = data.access_token;
    tokenExpiresAt = data.expires_at;

    console.log("Получен новый токен доступа");
    return accessToken;
  } catch (error) {
    console.error(
      "Ошибка получения токена:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Маршрут-прокси для обработки запросов к GigaChat
app.post("/api/ask", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Сообщение обязательно" });
    }

    // ========== НОВОЕ: Ищем в мок-документах ==========
    const documents = searchMockDocuments(message);

    if (documents.length === 0) {
      return res.json({
        response:
          "Информация не найдена в базе знаний. Обратитесь к старшему менеджеру.",
        sources: [],
      });
    }

    // Формируем контекст из найденных документов
    const context = documents
      .map((doc) => `# ${doc.title}\n${doc.content}`)
      .join("\n\n");

    // Получаем актуальный токен
    const token = await getAccessToken();

    const response = await axios.post(
      GIGA_API_URL,
      {
        model: "GigaChat",
        messages: [
          {
            role: "system",
            content: `Ты AI-ассистент по документации банка. Отвечай ТОЛЬКО на основе предоставленных документов.
                     
    ДОКУМЕНТЫ ДЛЯ ОТВЕТА:
    ${context}
    ПРАВИЛА ФОРМАТИРОВАНИЯ:
    1. Используй ЧЕТКИЕ ПЕРЕНОСЫ СТРОК между разделами
    2. Добавляй ДВОЙНОЙ ПЕРЕНОС между абзацами
    3. Используй маркированные списки
    4. Выделяй важное **жирным**
    5. Добавляй смайлики для дружелюбия 😊
    
    ОТВЕЧАЙ С ПРАВИЛЬНЫМ ФОРМАТИРОВАНИЕМ:`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      },
      {
        httpsAgent: httpsAgent,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const answer = response.data.choices[0].message.content;

    // Возвращаем ответ + источники
    res.json({
      response: answer,
      sources: documents.map((doc) => ({
        title: doc.title,
        url: doc.url,
      })),
    });
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    res.status(500).json({
      error:
        "Ошибка сервера: " + (error.response?.data?.message || error.message),
    });
  }
});

// Добавляем обработчик для корневого пути
app.get("/", (req, res) => {
  res.json({ message: "GigaChat Proxy Server работает" });
});

// Запускаем сервер
app.listen(port, () => {
  console.log(`Прокси-сервер запущен на http://localhost:${port}`);
});
