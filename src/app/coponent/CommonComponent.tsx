import { Grid, Typography } from "@mui/material";
import { styled } from "@mui/system";
import { createTheme } from "@mui/material/styles";
import { getUserInfo } from "@/services/authBP/UserInfo";
import Cookies from "js-cookie";

export type memberInfoType = {
  id: string | number;
  userId: string | number;
  username: string;
  userContactModel: {
    stateName: string;
    cityName: string;
    address: any;
    postalCode: string;
    [key: string]: any
  }[];
  fullName: string;
  nationalCode: string;
  [key: string]: any;
}

export const GridContainerCard = styled(Grid)({
  padding: "1rem",
  border: "1px solid #DDE1E6",
  borderRadius: "1.5rem",
  width: "100%",
});

export const textFieldTheme = createTheme({
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          marginTop: "0.5rem",
          "& .MuiOutlinedInput-root": {
            backgroundColor: "white",
            "& fieldset": {
              borderRadius: "0.7rem",
              minHeight: "3rem",
              "&:disabled": {
                borderColor: "white",
                backgroundColor: "inherit",
              },
            },
            "&:hover fieldset": {
              borderColor: "#DDE1E6",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#DDE1E6",
            },
            "& input": {
              backgroundColor: "white",
            },
          },
          "& .MuiOutlinedInput-input": {
            padding: "0.8rem 0.5rem",
          },
          "& .MuiFormHelperText-root": {
            marginLeft: "0px",
          },
        },
      },
    },
  },
});

export const ResponseTypography = styled(Typography)({
  fontWeight: "bold",
  wordBreak: "break-word",
});

export const GridContainerSettings = styled(Grid)({
  backgroundColor: "#F2F4F8",
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  height: "2rem",
  borderRadius: "0.5rem",
});

export const RequiredStart = styled(Typography)({
  color: "#d32f2f",
  marginTop: "3px",
  marginRight: "5px",
});

// field filter model
export const fieldModel = (fieldName: string, operation: string = "EQUAL", condition: "AND" | "OR" = "AND") => ({
  "fieldName": fieldName,
  "fieldOperation": operation,
  "fieldValue": "",
  "nextConditionOperator": condition,
});

export const dateTimeFilterModel = (date: string, time: "00:00:00" | "23:59:59") => {
  const dateSplit = date.split("/");
  const timeSplit = time.split(":");

  return {
    year: dateSplit[0],
    month: dateSplit[1],
    day: dateSplit[2],
    hour: timeSplit[0],
    minute: timeSplit[1],
    second: timeSplit[2],
  };
};

export const checkResponse = (response: any): boolean => {
  return response.status && response.statusText && response.status != 200;
};

export const getFeatureAcl = (aclList: any[] = [], featureModelAcl: { [key: string]: string }): {
  [key: string]: boolean
} => {

  let accessRights = createInitialAclState(featureModelAcl);

  aclList.forEach(item => {
    Object.keys(featureModelAcl).forEach(key => {
      if (item.data.langId === featureModelAcl[key]) {
        accessRights[key] = true;
      }
    });
  });

  return accessRights;
};

export const getUserAclList = async () => {
  const { aclList } = await getUserInfo();
  return aclList;
};

export const createInitialAclState = (obj: { [key: string]: string }): { [key: string]: boolean } => {
  return Object.keys(obj).reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {});
};


export const memberRequestRegisterCookieKey = "mtsUserRequest";
export const memberRequestRegisterCashCookieKey = "mtsUserCashGateway";

export const setCookie = (key: string, value: string, expiresTime: number = 1 / 96) => {
  Cookies.set(key, value, { expires: expiresTime });
};

export const getCookie = (key: string) => {
  return Cookies.get(key);
};

export const removeItemCookie = (key: string) => {
  Cookies.remove(key);
};
