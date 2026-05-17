
// export async function requestAPi(
//   method: "Get" | "Post" | "Put" | "Patch" | "Delete" = "Get",
//   url: string,
//   params: any,
//   hasToken: boolean,
//   dataApi: object | null,
//   hasClient: boolean,
//   options: object,
//   // options: RequestInit = {},
// ): Promise<any> {
//   let baseURL;
//   if (hasClient) {
//     baseURL = process.env.NEXT_PUBLIC_BASE_URL
//   } else {
//     baseURL = process.env.BASE_URL

//   }

//   if (!baseURL || baseURL === undefined) {
//     baseURL = "https://api.webinoplus.ir";
//   }
//   const urlWithParams = new URL(`${baseURL}${url}`);
//   console.log("ggggggggggggggggg", urlWithParams);

//   if (params) {
//     Object.keys(params).forEach((key) => urlWithParams.searchParams.append(key, params[key]));
//   }
//   const request = new Request(urlWithParams.toString(), {
//     ...options,
//     method: method.toUpperCase(), // Ensure method is uppercase
//   });
//   console.info('test for fetch', request, options);
  
//   try {
//     const response = await fetch(request);

//     if (!response.ok) {
//       const { status } = response;
//       const errorText = await response.text();

//       let errorMessage = `API request error: ${status}`;
//       const data = {
//         errorText: errorText,
//         hasError: true,
//         statusCode: status,
//       };
//       return data
//     }
//     const data = await response.json();

//     return data;
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     throw error;
//   }
// }


"use server";

export async function requestAPi(
  method: "Get" | "Post" | "Put" | "Patch" | "Delete" = "Get",
  url: string,
  params: any,
  hasToken: boolean,
  dataApi: object | null,
  hasClient: boolean,
  options: RequestInit = {},
): Promise<any> {
  let baseURL;
  if (hasClient) {
    baseURL = process.env.NEXT_PUBLIC_BASE_URL
  } else {
    baseURL = process.env.BASE_URL
  }

  if (!baseURL || baseURL === undefined) {
    baseURL = "https://api.webinoplus.ir";
  }
  
  const urlWithParams = new URL(`${baseURL}${url}`);
  console.log("ggggggggggggggggg", urlWithParams);

  if (params) {
    Object.keys(params).forEach((key) => urlWithParams.searchParams.append(key, params[key]));
  }
  
  // اصلاح نحوه ارسال درخواست
  const requestOptions: RequestInit = {
    ...options,
    method: method.toUpperCase(),
  };
  
  console.info('test for fetch', requestOptions);
  
  try {
    const response = await fetch(urlWithParams.toString(), requestOptions);
    
    if (!response.ok) {
      const { status } = response;
      const errorText = await response.text();

      let errorMessage = `API request error: ${status}`;
      const data = {
        errorText: errorText,
        hasError: true,
        statusCode: status,
      };
      return data
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      errorText: error.message,
      hasError: true,
      statusCode: 0,
    };
  }
}

