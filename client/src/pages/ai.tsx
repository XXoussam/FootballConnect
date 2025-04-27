import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestionTopics = [
  "Player performance analysis",
  "Training tips",
  "Tactical advice",
  "Nutrition for footballers",
  "Injury prevention",
  "Career development"
];

const AiChatPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your football assistant. How can I help you with your football career today?",
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock AI response based on user input
      let responseContent = "";
      const lowercaseInput = inputValue.toLowerCase();
      
      if (lowercaseInput.includes("training") || lowercaseInput.includes("practice")) {
        responseContent = "For effective training, consistency is key. I recommend focusing on both technical skills like ball control and physical conditioning. Would you like some specific drills based on your position?";
      } else if (lowercaseInput.includes("tactic") || lowercaseInput.includes("formation")) {
        responseContent = "Tactics should be adapted to your team's strengths. The popular formations like 4-3-3 or 4-2-3-1 each have unique advantages. What's your current team setup?";
      } else if (lowercaseInput.includes("injury") || lowercaseInput.includes("recovery")) {
        responseContent = "Injury prevention starts with proper warm-up and cool-down routines. Ensuring adequate rest between intense training sessions is also crucial. Have you been experiencing any specific issues?";
      } else if (lowercaseInput.includes("nutrition") || lowercaseInput.includes("diet")) {
        responseContent = "Nutrition for footballers should focus on balanced macronutrients with emphasis on carbohydrates for energy and protein for recovery. Hydration is also critical, especially on match days.";
      } else if (lowercaseInput.includes("career") || lowercaseInput.includes("professional")) {
        responseContent = "Building a football career requires dedication to training, networking with coaches and scouts, and consistently performing at your best. Have you considered creating a highlights reel to showcase your skills?";
      } else {
        responseContent = "That's an interesting question about football. Could you provide more details so I can give you a more specific answer?";
      }
      
      // Add AI response to chat
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error generating AI response:", error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (topic: string) => {
    setInputValue(topic);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Football AI Assistant</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Main chat area */}
        <div className="md:col-span-2">
          <Card className="h-[calc(100vh-220px)] flex flex-col">
            {/* Chat messages display */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <Avatar className={`h-8 w-8 ${message.role === "user" ? "ml-2" : "mr-2"} flex-shrink-0`}>
                      {message.role === "user" ? (
                        <div className="bg-blue-500 text-white h-full w-full flex items-center justify-center">
                          <i className="fas fa-user text-xs"></i>
                        </div>
                      ) : (
                        <div className="bg-emerald-500 text-white h-full w-full flex items-center justify-center">
                          <i className="fas fa-robot text-xs"></i>
                        </div>
                      )}
                    </Avatar>
                    
                    <div 
                      className={`rounded-lg px-4 py-3 ${
                        message.role === "user" 
                          ? "bg-blue-500 text-white" 
                          : "bg-neutral-100 text-neutral-800"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className={`text-xs mt-1 ${message.role === "user" ? "text-blue-100" : "text-neutral-500"}`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="flex">
                    <Avatar className="h-8 w-8 mr-2">
                      <div className="bg-emerald-500 text-white h-full w-full flex items-center justify-center">
                        <i className="fas fa-robot text-xs"></i>
                      </div>
                    </Avatar>
                    <div className="rounded-lg px-4 py-3 bg-neutral-100">
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <div className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Chat input area */}
            <div className="border-t p-4 flex">
              <Input
                placeholder="Ask me anything about football..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="mr-2"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
              >
                {isLoading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-paper-plane"></i>
                )}
              </Button>
            </div>
          </Card>
        </div>
        
        {/* Sidebar with suggestions */}
        <div>
          <Card className="p-4">
            <h2 className="font-semibold mb-3">Ask me about:</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {suggestionTopics.map((topic) => (
                <Badge 
                  key={topic} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-neutral-200"
                  onClick={() => handleSuggestionClick(topic)}
                >
                  {topic}
                </Badge>
              ))}
            </div>
            
            <h3 className="font-medium text-sm mb-2">How can I help you?</h3>
            <ul className="text-sm text-neutral-600 space-y-2">
              <li className="flex items-start">
                <i className="fas fa-chart-line text-xs mt-1 mr-2 text-neutral-400"></i>
                <span>Analyze your performance stats and suggest improvements</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-clipboard text-xs mt-1 mr-2 text-neutral-400"></i>
                <span>Create personalized training programs</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-users text-xs mt-1 mr-2 text-neutral-400"></i>
                <span>Provide tactics and formation advice</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-heartbeat text-xs mt-1 mr-2 text-neutral-400"></i>
                <span>Nutrition and fitness recommendations</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-trophy text-xs mt-1 mr-2 text-neutral-400"></i>
                <span>Career development guidance</span>
              </li>
            </ul>
            
            <div className="mt-6 pt-4 border-t text-xs text-neutral-500">
              <p className="mb-2">
                <i className="fas fa-info-circle mr-1"></i>
                This AI assistant provides general football advice. For specific medical or professional concerns, please consult with qualified professionals.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AiChatPage;