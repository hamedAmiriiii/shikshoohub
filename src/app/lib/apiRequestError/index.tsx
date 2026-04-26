// "use server";
// import { requestAPi } from "./fetchWithAuthWithError";

// export async function apiRequestError(
//   method: "Get" | "Post" | "Put" | "Patch" | "Delete" | undefined,
//   params: object,
//   data: object,
//   url: string,
//   hasToken: boolean,
//   hasClient: boolean = false,
//   token :string
// ): Promise<any> {
//   // const session = await localStorage.getItem('token')

//   let headers: { [key: string]: string } = {
//     "Content-Type": "application/json",
//   };

//   if (hasToken) {
//     headers["Authorization"] = `Bearer ${token}`;
//   }

//   const options: RequestInit = {
//     // method: method,
//     headers,
//   };

//   if (method !== "Get" && Object.keys(data).length > 0) {
//     options.body = JSON.stringify(data);
//   }
//   const response = await requestAPi(
//     method,
//     url,
//     params,
//     hasToken,
//     data,
//     hasClient,
//     options
//   );

//   return response;
// }

// // نحوه استفاده
// // ApiRequest("Get", {}, {}, "/mhami/fp/setting/max-bank-facility", true, false).then((res) => {
// //   console.log("ttttttttttttttt2222222", res);
// // })


"use server";
import { requestAPi } from "./fetchWithAuthWithError";

export async function apiRequestError(
  method: "Get" | "Post" | "Put" | "Patch" | "Delete" = "Get", // مقدار پیش‌فرض اضافه شد
  params: object = {},
  data: object = {},
  url: string,
  hasToken: boolean,
  hasClient: boolean = false,
  token: string = ""
): Promise<any> {
  let headers: { [key: string]: string } = {
    "Content-Type": "application/json",
  };

  if (hasToken) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    headers,
  };

  if (method !== "Get" && Object.keys(data).length > 0) {
    options.body = JSON.stringify(data);
  }
  
  const response = await requestAPi(
    method,
    url,
    params,
    hasToken,
    data,
    hasClient,
    options
  );

  return response;
}