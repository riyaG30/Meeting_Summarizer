import React from "react";
import { Bee } from "@carbon/icons-react";
import "./Loading.scss";
const Loading = ({ text = "Loading..." }) => {
  return (
    <div className="bee-loader">
      <Bee size={24} className="bee-icon" />
      <span>{text}</span>
    </div>
  );
};
export default Loading;