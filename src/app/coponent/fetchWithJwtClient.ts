'use client';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://webinoplus.ir' ;
import { useState } from "react"
import tokenCode from "./tokenCode";
export async function FetchWithJwtClient(
    method: "GET" | "POST" | "PUT" | "DELETE",
    url: string,
    session: any,
    params: any = {},
    options: any = {}
): Promise<any> {

    try {
       let tokkkken = tokenCode()
        const headers = new Headers(options.headers || {});
        if (tokkkken) {
          headers.set("Authorization", `Bearer ${tokkkken}`);
        }

        // Build the query string from the params object
        const queryString = encodeURIComponent(JSON.stringify(params));
        const fullURL = `${baseURL}${url}${queryString === "%7B%7D"  ? '':`${queryString}`  }`;
        const response = await fetch(fullURL, {
          ...options,
          method: method,
          headers,
        });

        if (!response.ok) {
          const { status } = response;
          if (status === 401) {
          } else if (status === 403) {
          } else {
          }
          return null;
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error fetching datadata:", error);
        return null;
    }
}

