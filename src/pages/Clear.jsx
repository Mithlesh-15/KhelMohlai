import React, { useEffect } from "react";
import { queryClient } from "../lib/queryClient";
import { useNavigate } from "react-router-dom";

function Clear() {
  const navigate = useNavigate();
  useEffect(() => {
    queryClient.clear();
    localStorage.removeItem("khelmohlai-query-cache-v1");
    navigate("/");
  }, []);
  return <div>clear</div>;
}

export default Clear;
