"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";

export default function UploadSection() {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [resultMessage, setResultMessage] = useState(null);
  
  const { setAnalysisData } = useAnalysis();
  const inputRef = useRef(null);

  const handleFiles = (newFiles) => {
    const pdfs = Array.from(newFiles).filter(
      (f) => f.type === "application/pdf"
    );
    setFiles((prev) => [...prev, ...pdfs]);
    setResultMessage(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadProgress("Processing your files...");
    setResultMessage(null);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      // Calling FastAPI backend directly. Bypasses Next.js proxy to fix ECONNRESET / socket hang up bugs with multipart uploads.
      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        body: formData,
      });

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error("Server returned an invalid JSON response. Please check if your files are too large.");
      }
      
      if (response.ok && data.status === "success") {
        setUploadProgress("");
        if (data.ai_powered) {
          setResultMessage(`Success! ${data.files_processed} files processed with AI.`);
        } else {
          setResultMessage(`Success! ${data.files_processed} files processed. (Warning: AI disabled due to missing API key, using fallback)`);
        }
        setFiles([]); // Clear list on success
        
        // Save data to context
        setAnalysisData(data);
        
        // Scroll down to results if they exist on the page
        setTimeout(() => {
            document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" });
        }, 1500);
      } else {
        setUploadProgress("");
        setResultMessage(data.detail || data.message || "Failed to analyze files.");
      }
    } catch (error) {
      console.error(error);
      setUploadProgress("");
      setResultMessage(error.message.includes("Failed to fetch") ? "Connection error. Make sure the backend server is running on port 8000." : error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section id="upload" className="relative py-28 px-6 overflow-hidden">
      {/* JJK Background handles ambient elements globally now */}

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 flex items-center justify-center gap-3">
            <Sparkles className="text-accent" size={28} />
            Upload Your Papers
          </h2>
          <p className="text-text-secondary text-sm max-w-lg mx-auto">
            Drop your previous year question papers below. We support PDF files
            and will analyze them to build the prediction engine.
          </p>
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`upload-zone relative glass-card-strong rounded-3xl p-14 text-center cursor-pointer transition-smooth flex flex-col items-center justify-center ${
            dragging ? "dragging border-accent bg-accent/[0.05]" : "border-border"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <motion.div 
            animate={{ y: dragging ? -10 : 0, scale: dragging ? 1.1 : 1 }}
            className={`w-16 h-16 mb-5 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
              dragging ? "bg-accent/20 border-accent/50" : "bg-white/[0.03] border-white/10"
            } border shadow-inner`}
          >
            <Upload size={28} className={dragging ? "text-accent" : "text-text-secondary"} />
          </motion.div>

          <p className="text-base font-semibold text-text-primary mb-2">
            {dragging ? "Release to drop files" : "Drag & drop your PDFs or click to upload"}
          </p>
          <p className="text-sm text-text-muted">
            Only .pdf files are accepted
          </p>
          
          {/* Subtle glow effect within the box */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-transparent to-white/[0.01] pointer-events-none" />
        </motion.div>

        {/* Result Message Area */}
        <AnimatePresence>
            {resultMessage && (
                <motion.div
                   initial={{ opacity: 0, y: -10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className={`mt-6 text-center text-sm font-medium py-3 rounded-xl border ${
                     resultMessage.includes("Success")
                       ? "text-green-400 bg-green-400/10 border-green-400/20"
                       : "text-red-400 bg-red-400/10 border-red-400/20"
                   }`}
                >
                    {resultMessage}
                </motion.div>
            )}
        </AnimatePresence>

        {/* File List */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 space-y-3"
            >
              <div className="flex justify-between items-end mb-2 px-1">
                 <h4 className="text-sm font-semibold text-text-primary">Ready to process ({files.length})</h4>
              </div>
              
              <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2">
                  {files.map((file, i) => (
                    <motion.div
                      key={file.name + i}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.03)" }}
                      className="glass-card flex items-center gap-4 px-5 py-3.5 rounded-2xl group border-border/50"
                    >
                      <div className="p-2 rounded-lg bg-accent/10 text-accent">
                          <FileText size={18} />
                      </div>
                      <span className="text-sm text-text-primary font-medium truncate flex-1 block">
                        {file.name}
                      </span>
                      <span className="text-xs font-mono text-text-muted flex-shrink-0">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(i);
                        }}
                        disabled={uploading}
                        className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:bg-red-400/10 text-text-muted hover:text-red-400 transition-all disabled:pointer-events-none"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  ))}
              </div>

              {/* Progress Feedback */}
              <AnimatePresence>
                {uploading && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col items-center pt-4"
                  >
                     <div className="w-full bg-white/5 rounded-full h-1.5 mb-3 overflow-hidden relative">
                         <motion.div 
                            className="absolute top-0 bottom-0 left-0 bg-accent w-1/3 rounded-full"
                            animate={{
                                left: ["-30%", "100%"]
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 1.5,
                                ease: "linear"
                            }}
                         />
                     </div>
                     <span className="text-xs text-text-muted font-medium flex items-center gap-2">
                        <Loader2 size={12} className="animate-spin" />
                        {uploadProgress}
                     </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Analyze Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={handleAnalyze}
                disabled={uploading || files.length === 0}
                data-magnetic
                className="mt-6 w-full py-4 rounded-xl jjk-gradient-btn text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Analyze PDFs
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
