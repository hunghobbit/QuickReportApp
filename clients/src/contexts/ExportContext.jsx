import { createContext, useContext, useState } from "react";
import { createInitialRecordForm } from "@/config/record-schema";
import { today } from "@/utils/date";

const AppContext = createContext(null);

export const ModalFormInitValuesProvider = ({ children }) => {
  const [initForm, setInitForm] = useState(() => createInitialRecordForm());
  const [reportDate, setReportDate] = useState(() => today());
  const [isReportFormModalOpen, setIsReportFormModalOpen] = useState(false);

  const openReportFormModal = (initialValues = null) => {
    if (initialValues && typeof initialValues === "object") {
      setInitForm(createInitialRecordForm(initialValues));
    }
    setIsReportFormModalOpen(true);
  };

  const closeReportFormModal = () => {
    setIsReportFormModalOpen(false);
  };

  return (
    <AppContext.Provider
      value={{
        initForm,
        setInitForm,
        reportDate,
        setReportDate,
        isReportFormModalOpen,
        setIsReportFormModalOpen,
        openReportFormModal,
        closeReportFormModal,
      }}
    >
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
