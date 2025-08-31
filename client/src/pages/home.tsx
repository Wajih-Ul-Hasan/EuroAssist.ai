import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  GraduationCap, 
  Plus, 
  Send, 
  Menu, 
  MoreHorizontal, 
  Settings, 
  LogOut,
  Trash2,
  Euro,
  Trophy,
  BookOpen,
  Calendar,
  Bot,
  User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Chat, Message, User } from "@shared/schema";

interface ChatWithMessages {
  chat: Chat;
  messages: Message[];
}

export default function Home() {
  const { user, isLoading: authLoading } = useAuth() as { user: User | undefined, isLoading: boolean };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  // Fetch user chats
  const { data: chats = [], isPending: chatsLoading } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
    enabled: !!user,
  });

  // Fetch current chat messages
  const { data: currentChatData, isPending: messagesLoading } = useQuery({
    queryKey: ["/api/chats", currentChatId],
    enabled: !!currentChatId,
  }) as { data: ChatWithMessages | undefined; isPending: boolean };

  // Create new chat mutation
  const createChatMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest("POST", "/api/chats", { title });
      return response.json();
    },
    onSuccess: (newChat: Chat) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      setCurrentChatId(newChat.id);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ chatId, content }: { chatId: string; content: string }) => {
      const response = await apiRequest("POST", `/api/chats/${chatId}/messages`, {
        content,
        role: "user"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats", currentChatId] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      setMessage("");
      setIsTyping(false);
    },
    onError: (error) => {
      setIsTyping(false);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      await apiRequest("DELETE", `/api/chats/${chatId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      if (currentChatId && chats.length > 1) {
        const remainingChats = chats.filter((chat) => chat.id !== currentChatId);
        if (remainingChats.length > 0) {
          setCurrentChatId(remainingChats[0].id);
        } else {
          setCurrentChatId(null);
        }
      } else {
        setCurrentChatId(null);
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChatData?.messages]);

  const handleNewChat = async () => {
    try {
      const newChat = await createChatMutation.mutateAsync("New Chat");
      if (newChat?.id) {
        setCurrentChatId(newChat.id);
      }
    } catch (err) {
      // error handled by onError
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !currentChatId || sendMessageMutation.isPending) return;
    
    setIsTyping(true);
    try {
      await sendMessageMutation.mutateAsync({ chatId: currentChatId, content: message.trim() });
    } catch (err) {
      // error handled by onError
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    {
      icon: Euro,
      title: "Compare tuition fees",
      subtitle: "Between universities",
      question: "What are the tuition fees for Oxford University compared to other UK universities?"
    },
    {
      icon: Trophy,
      title: "University rankings",
      subtitle: "Latest rankings data",
      question: "What are the top-ranked engineering universities in Germany?"
    },
    {
      icon: BookOpen,
      title: "Scholarship opportunities",
      subtitle: "Available funding",
      question: "What scholarships are available for international students in France?"
    },
    {
      icon: Calendar,
      title: "Admission deadlines",
      subtitle: "Important dates",
      question: "When are the application deadlines for universities in the Netherlands?"
    }
  ];

  const handleSuggestedQuestion = async (question: string) => {
    if (!currentChatId) {
      try {
        const newChat = await createChatMutation.mutateAsync("New Chat");
        if (newChat?.id) {
          setCurrentChatId(newChat.id);
          setMessage(question);
        } else {
          setMessage(question);
        }
      } catch (err) {
        setMessage(question);
      }
    } else {
      setMessage(question);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className={cn(
        "sidebar-transition flex-shrink-0 bg-sidebar border-r border-border flex flex-col",
        sidebarOpen ? "w-80" : "w-0 lg:w-80",
        "lg:translate-x-0",
        !sidebarOpen && "-translate-x-full lg:translate-x-0"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-semibold">EuroAssist.ai</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
              data-testid="button-sidebar-toggle"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <Button
            onClick={handleNewChat}
            disabled={createChatMutation.isPending}
            className="w-full bg-muted hover:bg-input text-foreground border-0"
            data-testid="button-new-chat"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-4">
            {chatsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {chats.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No chats yet. Start a new conversation!
                  </p>
                ) : (
                  chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-colors group",
                        "hover:bg-muted",
                        currentChatId === chat.id && "bg-muted"
                      )}
                      onClick={() => setCurrentChatId(chat.id)}
                      data-testid={`chat-item-${chat.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {chat.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(chat.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 p-1 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChatMutation.mutate(chat.id);
                          }}
                          data-testid={`button-delete-chat-${chat.id}`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* User Profile */}
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-foreground">
                  {user?.firstName?.[0] || user?.email?.[0] || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" data-testid="text-user-name">
                  {user?.firstName || user?.email || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" className="p-1.5" data-testid="button-settings">
                <Settings className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1.5"
                onClick={() => window.location.href = "/api/logout"}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
                data-testid="button-mobile-sidebar-toggle"
              >
                <Menu className="w-4 h-4" />
              </Button>
              <div>
                <h2 className="text-lg font-semibold">European University Assistant</h2>
                <p className="text-sm text-muted-foreground">
                  Ask about fees, rankings, scholarships, and admission dates
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {currentChatId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteChatMutation.mutate(currentChatId)}
                  disabled={deleteChatMutation.isPending}
                  data-testid="button-clear-chat"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto p-4 space-y-6">
              {!currentChatId || (currentChatData?.messages.length === 0) ? (
                /* Welcome Screen */
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Welcome to EuroAssist.ai</h3>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Your AI-powered assistant for European university information. Ask about tuition fees, rankings, scholarships, admission dates, and more.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {suggestedQuestions.map((item, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="p-4 h-auto text-left border-border hover:bg-muted"
                        onClick={() => handleSuggestedQuestion(item.question)}
                        data-testid={`button-suggested-${index}`}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <item.icon className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="text-left">
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Chat Messages */
                <>
                  {messagesLoading ? (
                    <div className="space-y-4">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex space-x-3">
                          <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded animate-pulse"></div>
                            <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    currentChatData?.messages.map((msg: Message) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex space-x-3",
                          msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.role === "assistant" && (
                          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-accent-foreground" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-2xl rounded-2xl px-4 py-3",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-secondary rounded-bl-md"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        {msg.role === "user" && (
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-accent-foreground" />
                      </div>
                      <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"
                              style={{ animationDelay: `${i * 0.2}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Chat Input */}
        <div className="border-t border-border p-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask about European universities..."
                    className="bg-input border-border pr-12 resize-none min-h-[52px] max-h-32"
                    rows={1}
                    data-testid="input-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isPending || !currentChatId}
                    size="sm"
                    className="absolute right-2 bottom-2 bg-primary hover:bg-primary/90"
                    data-testid="button-send"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <span data-testid="text-char-count">{message.length} / 2000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}