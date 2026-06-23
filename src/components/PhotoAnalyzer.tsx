import React, { useRef, useState, useEffect } from "react";
import {
  Camera,
  Upload,
  X,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Check,
  Image as ImageIcon,
  Loader2,
  Smile
} from "lucide-react";
import { AvatarParameters } from "../types";

interface PhotoAnalyzerProps {
  onAnalyzeComplete: (avatar: Partial<AvatarParameters>) => void;
  onClose: () => void;
}

export default function PhotoAnalyzer({ 
  onAnalyzeComplete, 
  onClose 
}: PhotoAnalyzerProps) {
  const [activeMode, setActiveMode] = useState<"upload" | "webcam">("upload");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");

  // Webcam state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  // Analysis process states
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    "인공지능 분석용 사진 불러오기 완료 📸",
    "이목구비 분석 및 얼굴 특징 디코딩 중... 👁️👃👄",
    "입체 3D 아바타 헤어 & 피부 매칭 알고리즘 실행 중... 💇‍♂️✨",
    "어울리는 의상 스타일링 및 개성 넘치는 퍼스널 컬러 매칭 중... 👕🎨",
    "PersonaGen 3D Chibi 전신 3차원 피규어로 완벽 변환 중! 🚀"
  ];

  // Auto step intervals during loading
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "loading") {
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(timer);
  }, [status]);

  // Clean stream when unmounted
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setIsCameraLoading(true);
    setCameraError(null);
    try {
      if (streamRef.current) {
        stopCamera();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        "카메라(웹캠) 접근 권한을 얻을 수 없습니다. 브라우저 설정에서 카메라 권한이 승인되었는지 확인 후 재생해주시거나 '사진 업로드' 방식을 활용해 주세요."
      );
    } finally {
      setIsCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (activeMode === "webcam") {
      startCamera();
    } else {
      stopCamera();
    }
  }, [activeMode]);

  // Handle Drag over & Leave
  const [isDragActive, setIsDragActive] = useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("정상적인 이미지 파일(png, jpg, jpeg)을 선택해 주세요.");
      return;
    }
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewUrl(dataUrl);
      // Strip definition header if existing to get pure base64
      const base64Str = dataUrl.split(",")[1];
      setBase64Image(base64Str);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Webcam snapshot action
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL("image/jpeg");
    setPreviewUrl(dataUrl);
    const base64Str = dataUrl.split(",")[1];
    setBase64Image(base64Str);
    setMimeType("image/jpeg");
    stopCamera();
  };

  // Submit base64 photo to our local Gemini proxy
  const handleAnalyzePhoto = async () => {
    if (!base64Image) {
      setErrorMessage("먼저 분석할 사진을 업로드하거나 촬영해 주세요.");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      // Run backend route call
      const response = await fetch("/api/avatar/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          mimeType: mimeType,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `서버 에러가 발생했습니다. (Code ${response.status})`);
      }

      const rawResult = await response.json();
      
      // Safety Mapping of accessories since returned fields might differ
      let accessoryCode = "none";
      if (rawResult.glasses && rawResult.glasses !== "none") {
        const glassesMap: Record<string, string> = {
          classic: "classic_specs",
          round: "round_specs",
          sunglasses: "sunglasses",
          cyber: "visor",
        };
        accessoryCode = glassesMap[rawResult.glasses] || "classic_specs";
      } else if (rawResult.hat && rawResult.hat !== "none") {
        const hatMap: Record<string, string> = {
          cap: "cap",
          beanie: "beanie",
          crown: "crown",
          headband: "headband",
        };
        accessoryCode = hatMap[rawResult.hat] || "cap";
      }

      // Convert server format into standard app parameter state safely!
      const finalAvatarPatch: Partial<AvatarParameters> = {
        gender: rawResult.gender === "male" ? "male" : "female", // enforce strict 'male' | 'female'
        hairStyle: rawResult.hairStyle || "short",
        hairColor: rawResult.hairColor || "#1e293b",
        skinColor: rawResult.skinColor || "#ffe4e6",
        eyeColor: rawResult.eyeColor || "#06b6d4",
        expression: rawResult.expression || "happy",
        clothingType: rawResult.clothingType || "bold-shirt", // safe fallback or standard shirt
        clothingColor: rawResult.clothingColor || "#1e293b",
        facialHair: rawResult.facialHair === "none" ? "none" : rawResult.gender === "male" ? "beard" : "none",
        facialHairColor: rawResult.facialHairColor || rawResult.hairColor || "#1e293b",
        accessory: accessoryCode,
        summaryText: rawResult.summaryText || "AI 사진 분해 해독으로 완벽하게 연출된 큐트한 캐릭터입니다."
      };
      
      // Set actual requested garment types appropriately
      if (rawResult.clothingType === "shirt") {
        finalAvatarPatch.clothingType = "shirt";
      } else if (rawResult.clothingType === "hoodie") {
        finalAvatarPatch.clothingType = "hoodie";
      } else if (rawResult.clothingType === "suit") {
        finalAvatarPatch.clothingType = "retro_suit";
      } else if (rawResult.clothingType === "sweater") {
        finalAvatarPatch.clothingType = "sweater";
      } else {
        finalAvatarPatch.clothingType = "shirt";
      }

      // Add other default cute settings for aesthetic balance
      if (rawResult.eyeStyle) {
        finalAvatarPatch.eyeStyle = rawResult.eyeStyle;
      }
      
      setStatus("success");
      onAnalyzeComplete(finalAvatarPatch);
    } catch (err: any) {
      console.error("Analysis failure:", err);
      setStatus("error");
      setErrorMessage(err?.message || "Gemini 분석 도중 예기치 못한 네트워크 장벽이 발생하였습니다. 다시 시도해 주세요.");
    }
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setBase64Image(null);
    setStatus("idle");
    setErrorMessage(null);
    if (activeMode === "webcam") {
      startCamera();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div 
        id="photo-analyzer-modal"
        className="bg-white w-full max-w-lg rounded-[28px] border border-[#E1DEE6] shadow-2xl overflow-hidden flex flex-col justify-between max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#FAF9FC] flex justify-between items-center bg-gradient-to-r from-[#9B51E0]/5 to-[#E051AE]/5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#9B51E0] animate-pulse" />
            <div>
              <h2 className="text-base font-bold text-[#5C218B] font-serif">
                AI 실시간 사진 인식 & 아바타 빌더
              </h2>
              <p className="text-[10px] font-medium text-[#8C8894]">
                사진 업로드 또는 카메라 촬영 후 캐릭터 성격을 해독합니다
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#F0EFF4] text-[#8C8894] hover:text-[#33323D] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {status === "idle" && (
            <>
              {/* Switching modes */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F0EFF4] rounded-xl border border-[#DCD9E3]">
                <button
                  onClick={() => {
                    setActiveMode("upload");
                    setPreviewUrl(null);
                    setBase64Image(null);
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeMode === "upload"
                      ? "bg-white text-[#9B51E0] shadow-xs"
                      : "text-[#8C8894] hover:text-[#33323D]"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>사진 파일 올리기</span>
                </button>
                <button
                  onClick={() => {
                    setActiveMode("webcam");
                    setPreviewUrl(null);
                    setBase64Image(null);
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeMode === "webcam"
                      ? "bg-white text-[#9B51E0] shadow-xs"
                      : "text-[#8C8894] hover:text-[#33323D]"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>실시간 웹캠 촬영</span>
                </button>
              </div>

              {/* Upload Mode Area */}
              {activeMode === "upload" && !previewUrl && (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                  className={`border-2 border-dashed rounded-2xl h-64 flex flex-col items-center justify-center text-center p-6 transition-all cursor-pointer ${
                    isDragActive
                      ? "border-[#9B51E0] bg-[#9B51E0]/5 scale-98"
                      : "border-[#DCD9E3] hover:border-[#9B51E0] bg-[#FAF9FC]"
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload-input"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-3.5">
                    <div className="w-12 h-12 bg-white border border-[#DCD9E3] rounded-full flex items-center justify-center text-[#9B51E0] shadow-xs transition-transform duration-300 hover:scale-110">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#33323D]">
                        여기에 인물 사진 파일을 드래그하여 드롭하거나 터치/클릭하기
                      </p>
                      <p className="text-[10px] font-medium text-[#8C8894] mt-1">
                        클릭 또는 터치하시면 기기 내부의 사진첩/파일 선택창이 즉시 열립니다 (JPG, PNG)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Webcam Mode Area */}
              {activeMode === "webcam" && !previewUrl && (
                <div className="relative border border-[#DCD9E3] bg-black rounded-2xl overflow-hidden h-64 flex flex-col items-center justify-center">
                  {cameraError ? (
                    <div className="p-4 text-center text-white flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 text-rose-500 animate-bounce" />
                      <p className="text-xs leading-relaxed max-w-xs">{cameraError}</p>
                    </div>
                  ) : (
                    <>
                      {isCameraLoading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 text-white gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-[#9B51E0]" />
                          <p className="text-[10px] font-medium">카메라 작동 대기 중...</p>
                        </div>
                      )}
                      
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover scale-x-[-1]"
                        playsInline
                        muted
                      />

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                        <button
                          onClick={captureSnapshot}
                          id="btn-confirm-snapshot"
                          className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#9B51E0] to-[#E051AE] hover:opacity-90 active:scale-95 text-white text-xs font-bold rounded-full shadow-lg cursor-pointer transition-all border border-[#ffffff]/20"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>찰칵! 사진 촬영</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Snap/Upload Preview */}
              {previewUrl && (
                <div className="space-y-4">
                  <div className="relative border border-[#DCD9E3] rounded-2xl overflow-hidden h-64 bg-[#FAF9FC] flex justify-center items-center">
                    <img
                      src={previewUrl}
                      alt="Uploaded face profile template preview"
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      onClick={handleReset}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
                      title="다시 가져오기"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex gap-2.5">
                    <button
                      onClick={handleReset}
                      className="flex-1 py-2.5 border border-[#DCD9E3] text-[#33323D] hover:bg-[#FAF9FC] active:scale-98 font-bold text-xs rounded-xl cursor-pointer transition-all"
                    >
                      다시 찍기 • 올리기
                    </button>
                    <button
                      onClick={handleAnalyzePhoto}
                      id="btn-start-analyze"
                      className="flex-1 py-2.5 bg-[#9B51E0] hover:bg-[#823EB8] active:scale-98 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md border-0 transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>추출 & 아바타 AI 생성</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Loading status (Gemini Thinking representation) */}
          {status === "loading" && (
            <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-[#9B51E0]/20 opacity-75"></span>
                <div className="w-16 h-16 rounded-full border-4 border-[#FAF9FC] border-t-[#9B51E0] animate-spin flex items-center justify-center shadow-md">
                  <Sparkles className="w-6 h-6 text-[#9B51E0] animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#33323D]">
                  얼굴 윤곽 특징 해독 중...
                </h3>
                <p className="text-[11px] font-bold text-[#8C8894] font-mono tracking-wide h-6">
                  {loadingSteps[loadingStep]}
                </p>
                <div className="w-48 h-1.5 bg-[#F0EFF4] rounded-full mx-auto overflow-hidden mt-2.5">
                  <div 
                    className="h-full bg-gradient-to-r from-[#9B51E0] to-[#E051AE] transition-all duration-1000 rounded-full"
                    style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-[9px] text-[#8C8894] font-medium leading-relaxed max-w-xs">
                Gemini Multi-Modal AI가 업로드하신 인물 사진의 이목구비, 성향, 색상 연출 매크로를 연산하여 3D Chibi 전신 모델링으로 자동 변환 연동 중입니다.
              </p>
            </div>
          )}

          {/* Success status screen */}
          {status === "success" && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-4 animate-scale-up">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-xs border border-emerald-100">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-emerald-600">
                  3D Chibi 아바타 변환 완료!
                </h3>
                <p className="text-[10px] text-[#8C8894] font-medium">
                  인물 사진 분석 결과가 인형 모델에 실시간으로 적용되었습니다.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-transform cursor-pointer"
              >
                피규어 확인하기
              </button>
            </div>
          )}

          {/* Error handling block */}
          {status === "error" && (
            <div className="py-6 px-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-4 text-center">
              <div className="w-12 h-12 bg-white text-rose-500 rounded-full mx-auto flex items-center justify-center shadow-xs border border-rose-100">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-rose-700">분석에 장애가 발생했습니다</h3>
                <p className="text-[11px] text-rose-600 leading-relaxed max-w-sm mx-auto">
                  {errorMessage}
                </p>
              </div>
              <div className="flex gap-2 max-w-xs mx-auto pt-1">
                <button
                  onClick={handleReset}
                  className="flex-1 py-2 bg-white hover:bg-[#FAF9FC] text-[#33323D] border border-[#DCD9E3] font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  새로운 사진 시도
                </button>
                <button
                  onClick={handleAnalyzePhoto}
                  className="flex-1 py-2 bg-[#9B51E0] hover:bg-[#823EB8] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  재시도 (Retry)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info warning */}
        {status === "idle" && (
          <div className="px-6 py-3.5 bg-[#FAF9FC] border-t border-[#FAF9FC] flex justify-between items-center text-[9px] text-[#8C8894]">
            <span className="font-semibold">🔒 사진 보안: 업로드한 사진은 오직 1회성 AI 분석에만 쓰입니다.</span>
            <span className="font-mono">GEMINI-3.5-FLASH</span>
          </div>
        )}
      </div>
    </div>
  );
}
