import { useState, useEffect, useRef, FormEvent } from 'react';
import jsQR from 'jsqr';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, ScanLog } from '../types';
import { verifyAndScanTicket } from '../db';
import { playSuccessSound, playWarningSound, playErrorSound } from '../utils/audio';
import { Camera, QrCode, Keyboard, AlertCircle, Check, X, SwitchCamera, Info } from 'lucide-react';

interface ScannerProps {
  onScanCompleted: (result: ScanLog['result'], ticket?: Ticket, message?: string) => void;
  unscannedTickets: Ticket[];
  attendedTickets: Ticket[];
}

export default function Scanner({ onScanCompleted, unscannedTickets, attendedTickets }: ScannerProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  
  // Camera State
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanCooldown, setScanCooldown] = useState(false);
  
  // Manual State
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState('');

  // Scan Overlay Outcome State (for instant visual modal inside scanner)
  const [scanOutcome, setScanOutcome] = useState<{
    result: ScanLog['result'];
    code: string;
    message: string;
    ticket?: Ticket;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // List available video devices
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then((deviceList) => {
          const videoDevices = deviceList.filter(d => d.kind === 'videoinput');
          setDevices(videoDevices);
          if (videoDevices.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoDevices[0].deviceId);
          }
        })
        .catch((err) => {
          console.warn("Could not list media devices:", err);
        });
    }
  }, []);

  // Stop camera stream when component unmounts or camera is disabled
  const stopCamera = () => {
    setIsScanning(false);
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start Camera
  const startCamera = async (deviceId?: string) => {
    stopCamera();
    setCameraError('');
    setIsScanning(true);

    const targetDeviceId = deviceId || selectedDeviceId;
    const constraints: MediaStreamConstraints = {
      video: targetDeviceId 
        ? { deviceId: { exact: targetDeviceId } } 
        : { facingMode: 'environment' }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        videoRef.current.play();
        
        // Start decoding loop
        animationFrameIdRef.current = requestAnimationFrame(scanLoop);
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError(
        err.name === 'NotAllowedError' 
          ? 'Camera permission denied. Please grant permission in your browser.' 
          : 'Could not access webcam stream. Make sure it is not in use by another app.'
      );
      setIsScanning(false);
      setCameraEnabled(false);
    }
  };

  // Turn Camera On/Off Toggle
  const handleCameraToggle = () => {
    if (cameraEnabled) {
      stopCamera();
      setCameraEnabled(false);
    } else {
      setCameraEnabled(true);
      startCamera();
    }
  };

  // Switch Camera Device
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (cameraEnabled) {
      startCamera(deviceId);
    }
  };

  // Core QR Scan Decoding Loop
  const scanLoop = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) {
      animationFrameIdRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw frame to hidden canvas for decoding
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Use jsQR to decode qr code from pixel data
        const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (decoded && decoded.data && !scanCooldown) {
          // Found QR Code! Handle verification
          handleCodeVerification(decoded.data);
          
          // Trigger scan cooldown to prevent double scans
          setScanCooldown(true);
          setTimeout(() => {
            setScanCooldown(false);
          }, 3000); // 3 seconds cooldown
        }
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(scanLoop);
  };

  // Handle Scan Verification
  const handleCodeVerification = (code: string) => {
    const response = verifyAndScanTicket(code);
    
    // Play correct synthesized sound effect
    if (response.result === 'Verified') {
      playSuccessSound();
    } else if (response.result === 'Already Attended') {
      playWarningSound();
    } else {
      playErrorSound();
    }

    // Set local scanner outcome overlay
    setScanOutcome({
      result: response.result,
      code,
      message: response.message,
      ticket: response.ticket
    });

    // Notify parent component to update live stats/database view
    onScanCompleted(response.result, response.ticket, response.message);
  };

  // Manual Submission Handler
  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    setManualError('');
    
    const code = manualCode.trim().toUpperCase();
    if (!code) {
      setManualError('Please enter a ticket code');
      return;
    }


    handleCodeVerification(code);
    setManualCode('');
  };

  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full relative">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-850 bg-slate-950/80">
        <button
          onClick={() => { setActiveTab('camera'); setManualError(''); }}
          className={`flex-1 py-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 border-b-2 transition-all ${
            activeTab === 'camera'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/40'
              : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/20'
          }`}
          id="tab-camera"
        >
          <Camera className="w-4 h-4" />
          <span>QR Scanner (Lens)</span>
        </button>
        <button
          onClick={() => { setActiveTab('manual'); stopCamera(); setCameraEnabled(false); }}
          className={`flex-1 py-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 border-b-2 transition-all ${
            activeTab === 'manual'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900/40'
              : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/20'
          }`}
          id="tab-manual"
        >
          <Keyboard className="w-4 h-4" />
          <span>Manual Input</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between relative min-h-[350px]">
        
        {/* Scanner Overlay Result (Modal overlay inside scanner container) */}
        <AnimatePresence>
          {scanOutcome && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-20 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center border border-slate-800 rounded-xl backdrop-blur-xs"
            >
              <div className="max-w-xs flex flex-col items-center">
                {/* Visual indicator */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, type: 'spring', stiffness: 200, damping: 15 }}
                  className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 border shadow-lg ${
                    scanOutcome.result === 'Verified'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/5'
                      : scanOutcome.result === 'Already Attended'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/5'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-rose-500/5'
                  }`}
                >
                  {scanOutcome.result === 'Verified' ? (
                    <Check className="w-10 h-10 stroke-[3]" />
                  ) : scanOutcome.result === 'Already Attended' ? (
                    <QrCode className="w-10 h-10" />
                  ) : (
                    <X className="w-10 h-10 stroke-[3]" />
                  )}
                </motion.div>

                {/* Scan Status Badge */}
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest mb-2 border ${
                    scanOutcome.result === 'Verified'
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                      : scanOutcome.result === 'Already Attended'
                      ? 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                      : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {scanOutcome.result}
                </span>

                <h3 className="text-xl font-mono text-white mb-1 font-bold tracking-tight">
                  {scanOutcome.code}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed mb-4 font-mono">
                  {scanOutcome.message}
                </p>

                {/* Additional Attendee Metadata if registered */}
                {scanOutcome.ticket && scanOutcome.ticket.name && (
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 w-full mb-6 text-left">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Attendee Profile</p>
                    <p className="text-sm font-semibold text-white truncate">{scanOutcome.ticket.name}</p>
                    <p className="text-xs text-slate-400 truncate">{scanOutcome.ticket.email}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-300">
                        {scanOutcome.ticket.type}
                      </span>
                      {scanOutcome.ticket.attendedAt && (
                        <span className="text-[10px] font-mono text-slate-500">
                          LOG: {new Date(scanOutcome.ticket.attendedAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setScanOutcome(null)}
                  className="w-full px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg uppercase tracking-wider transition-colors text-xs"
                >
                  Scan Next Ticket
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab 1: CAMERA SCANNER */}
        {activeTab === 'camera' && (
          <div className="flex-1 flex flex-col justify-center items-center">
            {cameraEnabled ? (
              <div className="w-full flex-1 flex flex-col items-center">
                {/* Camera Selection dropdown */}
                {devices.length > 1 && (
                  <div className="mb-3 flex items-center space-x-2 text-xs text-slate-400 bg-slate-950 border border-slate-850 rounded-lg py-1 px-2.5">
                    <SwitchCamera className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Source:</span>
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => handleDeviceChange(e.target.value)}
                      className="bg-transparent border-none font-medium focus:outline-none text-slate-200 cursor-pointer text-xs"
                    >
                      {devices.map((device, idx) => (
                        <option key={device.deviceId} value={device.deviceId} className="bg-slate-950 text-slate-200">
                          {device.label || `Camera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Webcam Video Box */}
                <div className="relative w-full max-w-[340px] aspect-square rounded-2xl border-4 border-slate-800 bg-black overflow-hidden shadow-2xl scanning-shimmer">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover transform -scale-x-1"
                    muted
                  />
                  {/* Hidden decoding canvas */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Corner Targets */}
                  <div className="absolute inset-8 border-2 border-dashed border-indigo-500/30 pointer-events-none rounded-lg flex items-center justify-center">
                    {/* Laser scanning visual center target line */}
                    <div className="w-4/5 h-0.5 bg-emerald-500/80 shadow-lg shadow-emerald-500" />
                  </div>

                  {/* Top Notification Overlay */}
                  <div className="absolute top-3 inset-x-0 mx-auto w-fit px-3 py-1 bg-black/80 backdrop-blur-xs rounded-full border border-white/10 text-[10px] text-white/90 font-mono tracking-wide flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>LENS ACTIVE</span>
                  </div>
                </div>

                <button
                  onClick={handleCameraToggle}
                  className="mt-4 px-4 py-2 bg-rose-950/25 hover:bg-rose-950/50 border border-rose-800/40 text-rose-400 text-xs font-mono rounded-lg transition-colors"
                >
                  Disable Camera Stream
                </button>
              </div>
            ) : (
              <div className="text-center py-12 flex-1 flex flex-col justify-center items-center px-4">
                <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center mb-4 text-slate-600 border border-slate-800/80">
                  <Camera className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-white mb-1">Webcam Scanner Inactive</h4>
                <p className="text-xs text-slate-400 max-w-xs mb-6">
                  Verify tickets instantly using your camera. Please allow camera permissions upon activation.
                </p>
                
                {cameraError && (
                  <div className="mb-4 p-3 bg-rose-950/25 text-rose-400 text-xs rounded-lg border border-rose-800/30 max-w-sm flex items-start space-x-2 text-left">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{cameraError}</span>
                  </div>
                )}

                <button
                  onClick={handleCameraToggle}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg uppercase tracking-wider transition-colors text-xs flex items-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Activate Camera Scanner</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: MANUAL ENTRY */}
        {activeTab === 'manual' && (
          <div className="flex-1 flex flex-col justify-center px-2">
            <form onSubmit={handleManualSubmit} className="space-y-4 max-w-md mx-auto w-full">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Enter Ticket Code
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="e.g. BGI-118139"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-indigo-400 font-mono font-bold focus:bg-slate-950/60 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-700 placeholder:font-sans uppercase text-center tracking-widest text-lg"
                  />
                  <button
                    type="submit"
                    className="px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors uppercase tracking-wider shadow-md shadow-indigo-600/10"
                  >
                    Verify Code
                  </button>
                </div>
                {manualError && (
                  <p className="text-xs text-rose-400 mt-1.5 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{manualError}</span>
                  </p>
                )}
              </div>

              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-850 text-xs text-slate-500 flex items-start space-x-2 font-mono">
                <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-400 uppercase">Manual Entry Protocol:</p>
                  <p className="mt-0.5 text-[11px]">Codes are case-insensitive and formatted as <code className="bg-slate-900 px-1 rounded text-indigo-400">BGI-XXXXXX</code>.</p>
                </div>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
