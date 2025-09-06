import { useState } from "react";
import "./index.css";

const PaymentForm = () => {
  const [user, setUser] = useState(null);
  console.log("Режим:", process.env.NODE_ENV);
  // Принудительная ошибка
  if (process.env.NODE_ENV === "production") {
    console.log(user.name, "user.name"); // Вызовет ошибку
  }
  return (
    <div className="test">
      <div>{user.name}</div>
    </div>
  );
};
export default PaymentForm;
