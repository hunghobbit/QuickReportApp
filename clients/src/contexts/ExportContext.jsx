// import { RECORD_SCHEMA } from "@/config/record-schema";
// import { createContext, useState, useContext } from "react";

// const ModalFormInitValuesContext = createContext();

// export const ModalFormInitValuesProvider = ({ children }) => {
//   const entriesMap = new Map();
//   const entries = RECORD_SCHEMA.formFields.map((field) =>
//     entriesMap.set(field, ""),
//   );
//   const [initForm, setInitForm] = useState(Object.fromEntries(entries.values()));

//   return (
//     <ModalFormInitValuesContext.Provider value={{ initForm, setInitForm }}>
//       {children}
//     </ModalFormInitValuesContext.Provider>
//   );
// };

// export const useModalFormInitValues = () =>
//   useContext(ModalFormInitValuesContext);
import { createContext, useContext, useState } from "react";
import { createInitialRecordForm } from "@/config/record-schema";
import { today } from "@/utils/date";

const AppContext = createContext(null);

export const ModalFormInitValuesProvider = ({ children }) => {
  const [initForm, setInitForm] = useState(() => createInitialRecordForm());
  const [reportDate, setReportDate] = useState(() => today());

  return (
    <AppContext.Provider value={{ initForm, setInitForm, reportDate, setReportDate }}>
      {children}
    </AppContext.Provider>
  );
};

export const useModalFormInitValues = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "useModalFormInitValues phải được dùng trong ModalFormInitValuesProvider",
    );
  }

  return context;
};
