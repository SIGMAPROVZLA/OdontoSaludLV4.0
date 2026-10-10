import React, { useState, useEffect } from 'react';
import { useSede } from '../../context/SedeContext';

interface VictoriaMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const VictoriaAssistantModal: React.FC = () => {
  const { sedeActiva } = useSede();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener('open-victoria-assistant', handleOpenEvent);
    return () => window.removeEventListener('open-victoria-assistant', handleOpenEvent);
  }, []);

  const [messages, setMessages] = useState<VictoriaMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: `¡Hola! Soy VictorIA, tu asistente clínica de OdontoSalud para ${sedeActiva.nombre}. ¿Deseas consultar sobre dolor agudo, indicaciones previas a tu cita o conocer la disponibilidad de Boxes?`,
      timestamp: 'Ahora',
    },
  ]);

  const quickQuestions = [
    '¿Qué incluye la evaluación?',
    '¿Qué hacer en caso de dolor agudo?',
    '¿Cuáles son los métodos de pago?',
    'Ubicación exacta de la sede',
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: VictoriaMessage = {
      id: String(Date.now()),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Respuesta inteligente contextual
    setTimeout(() => {
      let aiResponse = '';
      const lower = text.toLowerCase();

      if (lower.includes('dolor') || lower.includes('urgencia')) {
        aiResponse =
          '⚠️ Si presentas dolor agudo pulsátil o inflamación, te recomendamos agendar de inmediato bajo la categoría "Urgencia / Dolor". No coloques aspirinas directas sobre la encía. Te esperamos en recepción para triaje prioritario.';
      } else if (lower.includes('evaluación') || lower.includes('incluye')) {
        aiResponse =
          'Nuestra consulta de evaluación incluye inspección clínica completa, odontograma digital FDI de 5 caras, diagnóstico periapical con sensor digital RVG (baja radiación) y plan de presupuesto detallado en USD / Bs BCV.';
      } else if (lower.includes('pago') || lower.includes('precio') || lower.includes('bcv')) {
        aiResponse =
          'Aceptamos Pago Móvil, Efectivo en divisas (USD/EUR), Zelle y Punto de Venta. Las cotizaciones en Bolívares se calculan a la tasa oficial del BCV del día sin recargos.';
      } else if (lower.includes('ubicación') || lower.includes('donde')) {
        aiResponse = `Nuestra sede ${sedeActiva.nombre} está ubicada en: ${sedeActiva.direccion}. Contamos con estacionamiento con vigilancia privada.`;
      } else {
        aiResponse =
          `Con gusto puedo orientarte sobre los tratamientos con la Dra. María Alejandra Domínguez en ${sedeActiva.nombre}. También puedes comunicarte directo a WhatsApp al ${sedeActiva.telefono}.`;
      }

      const replyMsg: VictoriaMessage = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, replyMsg]);
      setIsTyping(false);
    }, 650);
  };

  return (
    <>
      {/* Botón Flotante VictorIA */}
      <div className="fixed bottom-24 right-4 z-40 flex items-center gap-2">
        <div className="bg-dental-deep-navy text-surface-clean-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce hidden sm:flex">
          <span className="w-2 h-2 rounded-full bg-vibrant-cyan" />
          <span className="text-xs font-semibold">¿Dudas? Pregunta a VictorIA</span>
        </div>

        <button
          type="button"
          aria-label="Abrir asistente virtual VictorIA"
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-dental-deep-navy via-primary to-vibrant-cyan text-surface-clean-white shadow-[0_12px_24px_rgba(0,194,203,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform relative"
        >
          <span className="material-symbols-outlined text-[28px]">smart_toy</span>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vibrant-cyan opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-vibrant-cyan" />
          </span>
        </button>
      </div>

      {/* Modal Conversacional */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-dental-deep-navy/70 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4">
          <div className="bg-surface-clean-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl flex flex-col gap-3 max-h-[85vh] h-[550px] animate-in slide-in-from-bottom duration-250">
            {/* Header del Chat */}
            <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-vibrant-cyan/20 text-tertiary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">smart_toy</span>
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-dental-deep-navy">
                    VictorIA • Asistente Dental
                  </h4>
                  <p className="text-[11px] text-status-success flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                    En línea • {sedeActiva.nombre}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-dental-deep-navy transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Historial de Mensajes */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-primary text-surface-clean-white rounded-br-none shadow-sm'
                        : 'bg-surface-subtle-ice text-dental-deep-navy border border-border-subtle rounded-bl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-secondary mt-0.5 px-1">{m.timestamp}</span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-surface-subtle-ice w-20">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" />
                </div>
              )}
            </div>

            {/* Chips de Preguntas Frecuentes */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="shrink-0 text-left text-[11px] bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle px-2.5 py-1.5 rounded-lg text-primary font-semibold transition-all active:scale-95"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input de Mensaje */}
            <div className="flex items-center gap-2 pt-1 border-t border-border-subtle shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escribe tu consulta médica aquí..."
                className="flex-1 h-11 px-3.5 rounded-xl bg-surface-subtle-ice text-dental-deep-navy text-xs border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                className="w-11 h-11 rounded-xl bg-primary text-surface-clean-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
