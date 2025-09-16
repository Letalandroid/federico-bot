import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
}

const ChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content:
        "¡Hola! Soy tu asistente virtual para el sistema de inventario. Puedo ayudarte con consultas sobre equipos, movimientos y reportes. ¿En qué puedo ayudarte?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const getResponseBot = async () => {
    const res = await fetch(import.meta.env.VITE_N8N_URL, {
      method: "POST",
      body: JSON.stringify({
        inputMessage,
      }),
    });

    const data = await res.json();

    return data?.response ?? "";
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Simulate API call - replace with actual chatbot API later
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const botResponse = import.meta.env.VITE_N8N_URL
        ? await getResponseBot()
        : generateBotResponse(inputMessage);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: botResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar tu mensaje. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes("equipo") || input.includes("inventario")) {
      return "Puedo ayudarte con información sobre equipos. Algunas consultas que puedo resolver:\n\n• Estado actual del inventario\n• Búsqueda de equipos específicos\n• Disponibilidad de equipos\n• Historial de equipos\n\n¿Qué información específica necesitas?";
    }

    if (input.includes("movimiento") || input.includes("asignación")) {
      return "Respecto a movimientos y asignaciones, puedo ayudarte con:\n\n• Consultar movimientos activos\n• Historial de asignaciones\n• Equipos asignados a docentes\n• Estado de devoluciones\n\n¿Qué movimiento te interesa consultar?";
    }

    if (input.includes("reporte") || input.includes("estadística")) {
      return "Puedo generar varios tipos de reportes:\n\n• Reporte por categorías\n• Equipos por estado\n• Movimientos por fecha\n• Estadísticas de uso\n\n¿Qué tipo de reporte necesitas?";
    }

    if (input.includes("ayuda") || input.includes("help")) {
      return "Estoy aquí para ayudarte con el sistema de inventario. Puedo asistirte con:\n\n🔍 **Consultas de equipos**\n📊 **Reportes y estadísticas**\n📋 **Movimientos y asignaciones**\n⚙️ **Configuración del sistema**\n\nSolo escribe tu pregunta y te ayudaré a encontrar la información que necesitas.";
    }

    return "Entiendo tu consulta. Para darte una respuesta más precisa, podrías especificar si necesitas información sobre:\n\n• Equipos específicos\n• Movimientos o asignaciones\n• Reportes\n• Configuración\n\nEsta funcionalidad estará completamente integrada con la base de datos del sistema próximamente.";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Asistente Virtual
        </h1>
        <p className="text-muted-foreground">
          Consulta información del inventario de forma rápida y sencilla
        </p>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Chat con Asistente IA
            <Badge variant="outline" className="ml-auto">
              En línea
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[480px] p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.type === "bot" && (
                    <div className="bg-primary text-primary-foreground rounded-full p-2 h-8 w-8 flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content ?? ""}
                    </div>
                    <div className={`text-xs mt-1 opacity-70`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>

                  {message.type === "user" && (
                    <div className="bg-accent text-accent-foreground rounded-full p-2 h-8 w-8 flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="bg-primary text-primary-foreground rounded-full p-2 h-8 w-8 flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Escribiendo...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu pregunta aquí..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Presiona Enter para enviar • Esta funcionalidad será integrada con
            IA próximamente
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ChatBot;
