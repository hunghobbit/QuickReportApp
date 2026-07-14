import { LABELS } from "./config.js";
import { buildTempRecordFromSupplementaryValues } from "./utils.js";
import { RECORD_SCHEMA, normalizeRecordInput } from "../../../configs/record-schema.js";

const FORM_FIELDS = RECORD_SCHEMA.formFields;

function getPreviewEntries(values = {}) {
  return Object.entries(values).filter(
    ([, value]) => value !== "" && value !== null && value !== undefined,
  );
}

export function createModalController({
  onSubmit,
  onClose,
  title = "Nhập thông tin bổ sung",
  content = "",
  previewTitle = "Xem lại thông tin",
  previewContent = "",
} = {}) {
  let modalRoot = null;
  let modalBody = null;
  let modalTitle = null;
  let modalForm = null;
  let modalFieldsContainer = null;
  let currentValues = {};
  let currentTempRecord = {};
  let currentConfig = { title, content, previewTitle, previewContent };

  function init() {
    if (modalRoot) return;

    modalRoot = document.createElement("div");
    modalRoot.className = "modal";
    modalRoot.id = "modal-root";
    modalRoot.hidden = true;
    modalRoot.innerHTML = `
      <div class="modal-content">
        <button class="close" type="button" aria-label="Đóng"></button>
        <div class="flex">
          <h2 id="modal-title"></h2>
        </div>
        <div id="modal-body"></div>
      </div>`;

    document.body.appendChild(modalRoot);

    modalBody = modalRoot.querySelector("#modal-body");
    modalTitle = modalRoot.querySelector("#modal-title");

    modalRoot.querySelector(".close").addEventListener("click", close);
    modalRoot.addEventListener("click", (event) => {
      if (event.target === modalRoot) close();
    });
    document.addEventListener("keydown", (event) => {
      if (!modalRoot.hidden && event.key === "Escape") close();
    });
  }

  function open(values = {}, config = {}) {
    init();
    currentConfig = { ...currentConfig, ...config };
    currentValues = normalizeRecordInput(values);
    currentTempRecord = buildTempRecordFromSupplementaryValues(currentValues);
    renderForm(currentValues);
    modalRoot.hidden = false;
  }

  function close() {
    if (!modalRoot) return;
    modalRoot.hidden = true;
    if (modalForm) modalForm.reset();
    if (modalBody) modalBody.innerHTML = "";
    if (modalFieldsContainer) modalFieldsContainer.innerHTML = "";
    if (onClose) onClose();
  }

  function renderForm(values = {}) {
    if (!modalBody || !modalTitle) return;

    modalTitle.textContent = currentConfig.title || "Nhập thông tin bổ sung";
    modalBody.innerHTML = `
      <form id="bo-sung" action="" method="post">
        ${currentConfig.content ? `<div class="modal-description">${currentConfig.content}</div>` : ""}
        <div id="modal-fields"></div>
        <div class="modal-actions">
          <button type="submit">Xác nhận</button>
        </div>
      </form>`;

    modalForm = modalRoot.querySelector("#bo-sung");
    modalFieldsContainer = modalRoot.querySelector("#modal-fields");

    if (!modalForm || !modalFieldsContainer) return;

    FORM_FIELDS.forEach((key) => {
      const wrapper = document.createElement("div");
      wrapper.className = "form-el-grid";

      const label = document.createElement("label");
      label.setAttribute("for", key);
      label.textContent = LABELS[key] || key;

      const input = document.createElement("input");
      input.type = "text";
      input.id = key;
      input.name = key;
      input.required = true;
      input.value = values[key] ?? "";

      wrapper.append(label, input);
      modalFieldsContainer.appendChild(wrapper);
    });

    modalForm.addEventListener("submit", handleSubmit);
  }

  function renderPreview(values = {}) {
    if (!modalBody || !modalTitle) return;

    modalTitle.textContent =
      currentConfig.previewTitle || currentConfig.title || "Xem lại thông tin";
    const previewEntries = getPreviewEntries(values);

    modalBody.innerHTML = `
      <div class="preview-content">
        ${currentConfig.previewContent ? `<div class="modal-description">${currentConfig.previewContent}</div>` : ""}
        <div id="preview-fields"></div>
        <div class="modal-actions">
          <button id="edit-preview" type="button">Sửa lại</button>
          <button id="confirm-preview" type="button">Xác nhận</button>
        </div>
      </div>`;

    const previewFields = modalRoot.querySelector("#preview-fields");
    if (previewFields) {
      previewEntries.forEach(([key, value]) => {
        const row = document.createElement("div");
        row.className = "form-el-grid";
        row.innerHTML = `<strong>${LABELS[key] || key}</strong>: ${value}`;
        previewFields.appendChild(row);
      });
    }

    const editButton = modalRoot.querySelector("#edit-preview");
    const confirmButton = modalRoot.querySelector("#confirm-preview");

    if (editButton) {
      editButton.addEventListener("click", () => renderForm(currentValues));
    }

    if (confirmButton) {
      confirmButton.addEventListener("click", () => {
        const result = onSubmit ? onSubmit(currentTempRecord) : null;
        if (result && typeof result.then === "function") {
          result.finally(() => close());
        } else {
          close();
        }
      });
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!modalForm) return;

    const formData = new FormData(modalForm);
    const rawValues = {};
    formData.forEach((value, key) => {
      if (value) rawValues[key] = value;
    });

    currentValues = normalizeRecordInput({ ...currentValues, ...rawValues });
    currentTempRecord = buildTempRecordFromSupplementaryValues(currentValues);
    renderPreview(currentTempRecord);
  }

  return {
    open,
    close,
  };
}
