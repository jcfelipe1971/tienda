import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, ArrowRight, HelpCircle } from "lucide-react";
import { StoreSettings } from "../types";

interface ChatWidgetProps {
  settings: StoreSettings;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ settings }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messageText, setMessageText] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "support"; text: string; time: string }>>([
    {
      sender: "support",
      text: "¡Hola! 👋 Bienvenido a nuestra tienda de ropa y calzado. ¿Tienes alguna pregunta o quieres consultar la disponibilidad de algún artículo?\n\nEscribe tu consulta aquí abajo y con gusto te atenderemos directamente en nuestro WhatsApp.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, chatHistory]);

  const getCleanNumber = () => {
    return settings.whatsappNumber.replace(/[^0-9]/g, "") || "5352943409";
  };

  const handleOpenWhatsApp = (customMessage: string) => {
    const cleanNumber = getCleanNumber();
    const formattedText = encodeURIComponent(customMessage);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${formattedText}`;
    
    // Open in a new window/tab safely
    window.open(whatsappUrl, "_blank");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = messageText.trim();
    if (!text) return;

    // Add user message to local visual history
    const userTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const updatedHistory = [
      ...chatHistory,
      { sender: "user" as const, text, time: userTime },
    ];
    setChatHistory(updatedHistory);
    setMessageText("");
    setIsRedirecting(true);

    // Show support message about redirection
    setTimeout(() => {
      const supportTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "support" as const,
          text: "¡Perfecto! Te estamos redirigiendo a WhatsApp para responderte al instante...",
          time: supportTime,
        },
      ]);
      
      // Execute the WhatsApp redirect
      handleOpenWhatsApp(text);
      setIsRedirecting(false);
    }, 800);
  };

  const handleQuickQuestion = (question: string) => {
    // Instantly add and open WhatsApp
    const userTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setChatHistory((prev) => [
      ...prev,
      { sender: "user" as const, text: question, time: userTime },
    ]);
    
    setIsRedirecting(true);
    setTimeout(() => {
      handleOpenWhatsApp(question);
      setIsRedirecting(false);
    }, 600);
  };

  const quickQuestions = [
    "👗 ¿Tienen disponibilidad de ropa de temporada?",
    "👟 ¿Cuáles tallas tienen en calzado?",
    "🚚 ¿Hacen envíos a domicilio?",
    "💳 ¿Cuáles son los métodos de pago?",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 bg-neutral-950 hover:bg-neutral-900 text-white p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          id="chat-toggle-floating-btn"
        >
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 text-xs font-bold whitespace-nowrap hidden sm:inline pl-1">
            ¿Dudas? Chat con soporte
          </span>
          <div className="relative">
            <MessageCircle className="w-6 h-6 fill-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-neutral-950 animate-pulse" />
          </div>
        </button>
      )}

      {/* Support Chat Box */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[520px] bg-neutral-50 border border-neutral-200/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="p-4 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-900">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-sm font-bold border border-emerald-500/20">
                  WS
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-neutral-950" />
              </div>
              <div>
                <h4 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  Soporte WhatsApp
                </h4>
                <p className="text-[10px] text-neutral-400 font-medium">
                  Atención directa • En línea ahora
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-neutral-900 rounded-lg text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Header Notice */}
          <div className="bg-emerald-50/80 border-b border-emerald-100/50 px-4 py-2 flex items-center gap-2">
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <p className="text-[10px] text-emerald-800 font-medium">
              Todos los mensajes se atienden en el número: <span className="font-bold">+{getCleanNumber()}</span>
            </p>
          </div>

          {/* Messages & Actions Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col scrollbar-thin">
            {chatHistory.map((msg, idx) => {
              const isSupport = msg.sender === "support";
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isSupport ? "items-start" : "items-end"} space-y-1`}
                >
                  <div className={`flex items-center gap-1.5 text-[9px] text-neutral-400 ${isSupport ? "" : "flex-row-reverse"}`}>
                    <span className="font-semibold">{isSupport ? "Soporte de Tienda" : "Tú"}</span>
                    <span>•</span>
                    <span>{msg.time}</span>
                  </div>
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      isSupport
                        ? "bg-white text-neutral-800 border border-neutral-200/60 rounded-tl-none shadow-xs"
                        : "bg-neutral-950 text-white rounded-tr-none shadow-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {/* Quick Questions Suggestions */}
            {chatHistory.length === 1 && (
              <div className="pt-2 space-y-2">
                <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider pl-1 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-neutral-400" />
                  <span>Preguntas Frecuentes Rápidas</span>
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickQuestion(q)}
                      className="text-left px-3.5 py-2.5 bg-white hover:bg-neutral-100 border border-neutral-200/80 rounded-xl text-xs text-neutral-700 hover:text-neutral-950 font-medium transition-all duration-200 cursor-pointer shadow-2xs hover:border-neutral-300"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-neutral-150 flex gap-2 items-center">
            <input
              type="text"
              required
              disabled={isRedirecting}
              placeholder="Escribe tu mensaje o consulta..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-neutral-950 focus:border-transparent transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isRedirecting}
              className="p-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
              title="Enviar por WhatsApp"
            >
              <Send className="w-4 h-4 fill-white" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
