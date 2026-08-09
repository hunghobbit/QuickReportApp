// clients/src/components/ai/CameraCapture.jsx
// Màn hình chụp ảnh trực tiếp với watermark (timestamp + tên cty + địa điểm + GPS).
// Tham khảo ứng dụng Timemark: watermark vẽ ngay tại thời điểm chụp, không thể chỉnh sửa.

import { useEffect, useRef, useState, useCallback } from "react";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCurrentPosition,
  getWatermarkLines,
  captureFromVideo,
  applyWatermark,
  downloadDataUrl,
} from "@/features/ai/watermark";

const MAX_IMAGES = 10;

export default function CameraCapture({ onCapture, onClose }) {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("idle"); // "idle" | "loading" | "ok" | "unavailable"
  const [images, setImages] = useState([]); // [{ dataUrl, mimeType }]
  const [isCapturing, setIsCapturing] = useState(false);

  const companyName = user?.name || "";

  // Lấy GPS khi mở component (không bắt buộc)
  useEffect(() => {
    let cancelled = false;
    setGpsStatus("loading");
    getCurrentPosition().then((pos) => {
      if (cancelled) return;
      if (pos) {
        setCoords(pos);
        setGpsStatus("ok");
      } else {
        setCoords(null);
        setGpsStatus("unavailable");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Mở camera
  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      // Ưu tiên camera sau (environment) cho chụp tài liệu/biển số
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError(
        "Không thể truy cập camera. Vui lòng kiểm tra quyền camera hoặc chọn ảnh từ thư viện.",
      );
      setCameraActive(false);
    }
  }, []);

  // Dừng camera khi unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Tự mở camera khi mount
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // Chụp ảnh từ camera + vẽ watermark ngay lập tức
  const handleCapture = useCallback(async () => {
    if (!videoRef.current || isCapturing) return;
    if (images.length >= MAX_IMAGES) {
      alert(`Tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }

    setIsCapturing(true);
    try {
      const lines = getWatermarkLines({
        companyName,
        location,
        coords,
        date: new Date(), // Thời điểm chụp chính xác
      });

      const { dataUrl, mimeType } = await captureFromVideo({
        video: videoRef.current,
        lines,
        mimeType: "image/jpeg",
      });

      setImages((prev) => [...prev, { data: dataUrl, dataUrl, mimeType }]);
    } catch (err) {
      alert("Không thể chụp ảnh: " + err.message);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, images.length, companyName, location, coords]);

  // Xử lý upload ảnh từ thư viện + vẽ watermark
  const handleFileUpload = useCallback(
    async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const remaining = MAX_IMAGES - images.length;
      const toProcess = files.slice(0, remaining);

      const lines = getWatermarkLines({
        companyName,
        location,
        coords,
        date: new Date(),
      });

      const processed = [];
      for (const file of toProcess) {
        const reader = new FileReader();
        const dataUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Không thể đọc file ảnh."));
          reader.readAsDataURL(file);
        });

        const { dataUrl: watermarked, mimeType } = await applyWatermark({
          imageSrc: dataUrl,
          lines,
          mimeType: file.type || "image/jpeg",
        });

        processed.push({ data: watermarked, dataUrl: watermarked, mimeType });
      }

      setImages((prev) => [...prev, ...processed]);
      if (e.target) e.target.value = "";
    },
    [images.length, companyName, location, coords],
  );

  // Xóa ảnh khỏi danh sách
  const removeImage = useCallback((index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDownloadImage = useCallback((image, index) => {
    if (!image?.dataUrl) return;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const fileName = `watermarked-image-${timestamp}-${index + 1}`;
    downloadDataUrl({
      dataUrl: image.dataUrl,
      fileName,
      mimeType: image.mimeType || "image/jpeg",
    });
  }, []);

  const handleDownloadAll = useCallback(() => {
    if (images.length === 0) return;

    images.forEach((image, index) => {
      if (!image?.dataUrl) return;
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      const fileName = `watermarked-image-${timestamp}-${index + 1}`;
      setTimeout(() => {
        downloadDataUrl({
          dataUrl: image.dataUrl,
          fileName,
          mimeType: image.mimeType || "image/jpeg",
        });
      }, index * 120);
    });
  }, [images]);

  // Tiếp tục → gửi ảnh lên AI
  const handleContinue = useCallback(() => {
    if (images.length === 0) {
      alert("Vui lòng chụp hoặc chọn ít nhất 1 ảnh.");
      return;
    }
    onCapture(images);
  }, [images, onCapture]);

  return (
    <div className="flex flex-col gap-4">
      {/* Địa điểm + GPS */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Địa điểm</span>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="VD: Cổng B - Nhà máy XYZ"
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">GPS</span>
          <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm">
            {gpsStatus === "loading" && (
              <span className="text-muted-foreground">Đang lấy vị trí...</span>
            )}
            {gpsStatus === "ok" && coords && (
              <span className="text-green-600">
                {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
              </span>
            )}
            {gpsStatus === "unavailable" && (
              <span className="text-muted-foreground">Không xác định</span>
            )}
            {gpsStatus === "idle" && (
              <span className="text-muted-foreground">Chưa lấy</span>
            )}
          </div>
        </div>
      </div>

      {/* Camera / Upload */}
      <div className="flex flex-col gap-3">
        {cameraActive ? (
          <div className="relative overflow-hidden rounded-xl border border-border bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-black/40 p-3">
              <Button
                type="button"
                onClick={handleCapture}
                disabled={isCapturing}
                // NÚT CHỤP ẢNH: VẼ HÌNH TRÒN TRONG NÚT, KHÔNG DÙNG ICON
                className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-white/20 text-white transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                aria-label="Chụp ảnh"
              >
                
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {cameraError || "Camera không khả dụng."}
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={startCamera}>
                Thử lại camera
              </Button>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                Chọn từ thư viện
              </Button>
            </div>
          </div>
        )}

        {/* Nút chọn từ thư viện (luôn hiển thị) */}
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            Thêm ảnh từ thư viện
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Preview ảnh đã chụp */}
      {images.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">
              Ảnh đã chụp ({images.length}/{MAX_IMAGES})
            </p>
            <Button type="button" variant="outline" size="sm" onClick={handleDownloadAll}>
              Tải tất cả
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((img, index) => (
              <div key={index} className="group relative overflow-hidden rounded-lg border border-border">
                <img
                  src={img.dataUrl}
                  alt={`Ảnh ${index + 1}`}
                  className="aspect-square w-full object-cover"
                />
                <div 
                // ở giao diên desktop, Hiển thị nút tải và xóa khi hover, còn ở giao diện mobile thì luôn hiển thị
                className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100 sm:inset-x-1 sm:bottom-1">
                  <button
                    type="button"
                    onClick={() => handleDownloadImage(img, index)}
                    className="rounded bg-black/70 px-2 py-1 text-[10px] font-medium text-white"
                  >
                    Tải
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="rounded bg-red-600/80 px-2 py-1 text-[10px] font-medium text-white"
                    aria-label={`Xóa ảnh ${index + 1}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Hủy
        </Button>
        <Button type="button" onClick={handleContinue} disabled={images.length === 0}>
          Tiếp tục ({images.length})
        </Button>
      </div>
    </div>
  );
}