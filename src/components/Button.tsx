import React, { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: React.FC<ButtonProps> = ({ className, ...props }) => {
  const buttonClasses = `bg-white hover:bg-slate-200 text-black font-bold py-2 px-4 rounded ${className}`;

  return <button className={buttonClasses} {...props} />;
};
