import React, {createContext, useState, useEffect, Children} from "react";
import axios from "axios";

export const AuthContext=createContext();


export const AuthProvider=({children})=>{
    
   const [token, setToken]=useState(null);

    return(
        <AuthContext.Provider value={{
            token, setToken
        }}>
            {children}
        </AuthContext.Provider>
    );
}