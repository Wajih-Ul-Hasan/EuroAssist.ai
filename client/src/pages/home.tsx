import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GraduationCap,
  Plus,
  Send,
  Menu,
  Settings,
  LogOut,
  Trash2,
  Euro,
  Trophy,
  BookOpen,
  Calendar,
  Bot,
  User as UserIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Chat, Message, User } from "@shared/schema";

interface ChatWithMessages {
  chat: Chat;
  messages: Message[];
}

export default function Home() {
  const { user, isLoading: authLoading } = useAuth() as {
    user: User | undefined;
    isLoading: boolean;
  };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sidebarOpen, setSidebarOpen] = useState(false); // Default to closed on mobile
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      // Auto-open sidebar on desktop, close on mobile
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle orientation change
  useEffect(() => {
    const handleOrientationChange = () => {
      // Small delay to allow for viewport adjustment
      setTimeout(() => {
        if (window.innerWidth < 1024) {
          setSidebarOpen(false);
        }
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth < 1024 && sidebarOpen) {
        const sidebar = document.getElementById('sidebar');
        const target = event.target as Node;
        if (sidebar && !sidebar.contains(target)) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

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
  const { data: chats = [], isLoading: chatsLoading } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
    enabled: !!user,
  });

  // Fetch current chat messages
  const { data: currentChatData, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/chats", currentChatId],
    enabled: !!currentChatId,
  }) as { data: ChatWithMessages | undefined; isLoading: boolean };

  // Create new chat mutation
  const createChatMutation = useMutation({
    mutationFn: async ({
      title,
      userId,
    }: {
      title: string;
      userId: string;
    }) => {
      const response = await apiRequest("POST", "/api/chats", {
        userId,
        title,
      });
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

  // Inside sendMessageMutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      chatId,
      content,
    }: {
      chatId: string;
      content: string;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/chats/${chatId}/messages`,
        {
          content,
          role: "user",
        },
      );
      const data = await response.json();
      console.log("Send message response:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/chats", currentChatId],
      });
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
        const remainingChats = chats.filter(
          (chat) => chat.id !== currentChatId,
        );
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

  const handleNewChat = () => {
    createChatMutation.mutate({
      title: "New Chat",
      userId: "13794508", // or dynamic userId
    });
    // Close sidebar on mobile after creating chat
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || sendMessageMutation.isPending) return;

    // If no current chat, create one first
    if (!currentChatId) {
      setIsTyping(true);
      const messageContent = message.trim();
      setMessage(""); // Clear the input immediately

      try {
        const newChat = await new Promise<Chat>((resolve, reject) => {
          createChatMutation.mutate(
            {
              title: "New Chat",
              userId: "13794508", // or dynamic userId
            },
            {
              onSuccess: resolve,
              onError: reject,
            },
          );
        });

        // Now send the message to the new chat
        sendMessageMutation.mutate({
          chatId: newChat.id,
          content: messageContent,
        });
      } catch (error) {
        setIsTyping(false);
        toast({
          title: "Error",
          description: "Failed to create chat",
          variant: "destructive",
        });
      }
    } else {
      setIsTyping(true);
      sendMessageMutation.mutate({
        chatId: currentChatId,
        content: message.trim(),
      });
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
      question:
        "What are the tuition fees for Oxford University compared to other UK universities?",
    },
    {
      icon: Trophy,
      title: "University rankings",
      subtitle: "Latest rankings data",
      question: "What are the top-ranked engineering universities in Germany?",
    },
    {
      icon: BookOpen,
      title: "Scholarship opportunities",
      subtitle: "Available funding",
      question:
        "What scholarships are available for international students in France?",
    },
    {
      icon: Calendar,
      title: "Admission deadlines",
      subtitle: "Important dates",
      question:
        "When are the application deadlines for universities in the Netherlands?",
    },
  ];

  const handleSuggestedQuestion = (question: string) => {
    if (!currentChatId) {
      // If no chat, create one and send question
      setIsTyping(true);
      createChatMutation.mutate(
        {
          title: "New Chat",
          userId: "13794508",
        },
        {
          onSuccess: (newChat: Chat) => {
            setCurrentChatId(newChat.id);
            sendMessageMutation.mutate({
              chatId: newChat.id,
              content: question,
            });
          },
        },
      );
    } else {
      setIsTyping(true);
      sendMessageMutation.mutate({
        chatId: currentChatId,
        content: question,
      });
    }
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
    // Close sidebar on mobile after selecting chat
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-4">
        <div className="text-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-muted-foreground text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        id="sidebar"
        className={cn(
          "fixed lg:relative z-50 lg:z-auto",
          "flex-shrink-0 bg-sidebar border-r border-border flex flex-col",
          "transition-transform duration-300 ease-in-out",
          "w-72 sm:w-80 lg:w-80 xl:w-96 2xl:w-[400px]",
          "h-full lg:h-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Sidebar Header */}
        <div className="p-3 sm:p-4 lg:p-4 xl:p-5 2xl:p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 text-primary-foreground" />
              </div>
              <h1 className="text-base sm:text-lg lg:text-xl xl:text-xl 2xl:text-2xl font-semibold truncate">
                EuroAssist.ai
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 sm:p-2"
              data-testid="button-sidebar-close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3 sm:p-4 lg:p-4 xl:p-5 2xl:p-6">
          <Button
            onClick={handleNewChat}
            disabled={createChatMutation.isPending}
            className="w-full bg-muted hover:bg-input text-foreground border-0 h-10 sm:h-11 lg:h-12 text-sm sm:text-base"
            data-testid="button-new-chat"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-3 sm:px-4 lg:px-4 xl:px-5 2xl:px-6">
            {chatsLoading ? (
              <div className="space-y-2 sm:space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 sm:h-16 lg:h-18 bg-muted/50 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-1 sm:space-y-2">
                {chats.length === 0 ? (
                  <p className="text-xs sm:text-sm text-muted-foreground text-center py-4 sm:py-6">
                    No chats yet. Start a new conversation!
                  </p>
                ) : (
                  chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "p-2.5 sm:p-3 lg:p-3 xl:p-4 rounded-lg cursor-pointer transition-all duration-200 group",
                        "hover:bg-muted active:bg-muted/80",
                        "touch-manipulation", // Improve touch responsiveness
                        currentChatId === chat.id && "bg-muted ring-1 ring-primary/20",
                      )}
                      onClick={() => handleChatSelect(chat.id)}
                      data-testid={`chat-item-${chat.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm lg:text-sm xl:text-base font-medium truncate">
                            {chat.title}
                          </p>
                          <p className="text-xs lg:text-xs xl:text-sm text-muted-foreground mt-0.5">
                            {new Date(chat.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 sm:p-1.5 h-auto opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChatMutation.mutate(chat.id);
                          }}
                          data-testid={`button-delete-chat-${chat.id}`}
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
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
        <div className="border-t border-border p-3 sm:p-4 lg:p-4 xl:p-5 2xl:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs sm:text-sm lg:text-base font-medium text-primary-foreground">
                  {user?.firstName?.[0] || user?.email?.[0] || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs sm:text-sm lg:text-base font-medium truncate"
                  data-testid="text-user-name"
                >
                  {user?.firstName || user?.email || "User"}
                </p>
                <p
                  className="text-xs lg:text-xs xl:text-sm text-muted-foreground truncate"
                  data-testid="text-user-email"
                >
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex space-x-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="p-1 sm:p-1.5 touch-manipulation"
                data-testid="button-settings"
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 sm:p-1.5 touch-manipulation"
                onClick={() => (window.location.href = "/api/logout")}
                data-testid="button-logout"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="border-b border-border p-3 sm:p-4 lg:p-4 xl:p-5 2xl:p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 sm:p-2 touch-manipulation"
                data-testid="button-mobile-sidebar-toggle"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold truncate">
                  European University Assistant
                </h2>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground truncate">
                  Ask about fees, rankings, scholarships, and admission dates
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="max-w-none sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 xl:p-8 space-y-4 sm:space-y-6">
              {!currentChatId || currentChatData?.messages.length === 0 ? (
                /* Welcome Screen */
                <div className="text-center py-6 sm:py-8 lg:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 lg:mb-6">
                    <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold mb-2 sm:mb-3 lg:mb-4">
                    Welcome to EuroAssist.ai
                  </h3>
                  <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-4 sm:mb-6 lg:mb-8 max-w-xs sm:max-w-2xl lg:max-w-3xl mx-auto px-4">
                    Your AI-powered assistant for European university
                    information. Ask about tuition fees, rankings, scholarships,
                    admission dates, and more.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 max-w-xs sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-2 sm:px-0">
                    {suggestedQuestions.map((item, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="p-3 sm:p-4 lg:p-5 h-auto text-left border-border hover:bg-muted transition-all duration-200 touch-manipulation"
                        onClick={() => handleSuggestedQuestion(item.question)}
                        data-testid={`button-suggested-${index}`}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 w-full">
                          <item.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary flex-shrink-0" />
                          <div className="text-left min-w-0 flex-1">
                            <p className="text-xs sm:text-sm lg:text-base font-medium truncate">{item.title}</p>
                            <p className="text-xs sm:text-sm lg:text-sm text-muted-foreground truncate">
                              {item.subtitle}
                            </p>
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
                    <div className="space-y-3 sm:space-y-4">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex space-x-2 sm:space-x-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-muted rounded-full animate-pulse flex-shrink-0"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-3 sm:h-4 bg-muted rounded animate-pulse"></div>
                            <div className="h-3 sm:h-4 bg-muted rounded animate-pulse w-3/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    currentChatData?.messages.map((msg: Message) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex space-x-2 sm:space-x-3 lg:space-x-4",
                          msg.role === "user" ? "justify-end" : "justify-start",
                        )}
                      >
                        {msg.role === "assistant" && (
                          <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-accent-foreground" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "rounded-2xl px-3 py-2 sm:px-4 sm:py-3 lg:px-5 lg:py-4",
                            "max-w-[85%] sm:max-w-[75%] lg:max-w-2xl xl:max-w-3xl",
                            "text-sm sm:text-base lg:text-base",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-secondary rounded-bl-md",
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        {msg.role === "user" && (
                          <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex space-x-2 sm:space-x-3 lg:space-x-4">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-accent-foreground" />
                      </div>
                      <div className="bg-secondary rounded-2xl rounded-bl-md px-3 py-2 sm:px-4 sm:py-3 lg:px-5 lg:py-4">
                        <div className="flex space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-muted-foreground rounded-full animate-pulse"
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
        <div className="border-t border-border p-3 sm:p-4 lg:p-4 xl:p-5 2xl:p-6 flex-shrink-0">
          <div className="max-w-none sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
            <div className="relative">
              <div className="flex items-end space-x-2 sm:space-x-3">
                <div className="flex-1 relative">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask about European universities..."
                    className={cn(
                      "bg-input border-border resize-none touch-manipulation",
                      "pr-12 sm:pr-14 lg:pr-16",
                      "min-h-[44px] sm:min-h-[52px] lg:min-h-[56px]",
                      "max-h-24 sm:max-h-32 lg:max-h-40",
                      "text-sm sm:text-base lg:text-base",
                      "rounded-lg sm:rounded-xl lg:rounded-2xl",
                    )}
                    rows={1}
                    data-testid="input-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    size="sm"
                    className={cn(
                      "absolute right-2 bottom-2 bg-primary hover:bg-primary/90 disabled:opacity-50",
                      "w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10",
                      "touch-manipulation",
                      "transition-all duration-200"
                    )}
                    data-testid="button-send"
                  >
                    {sendMessageMutation.isPending ? (
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs sm:text-sm text-muted-foreground px-1">
                <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
                <span className="sm:hidden">Enter to send</span>
                <span data-testid="text-char-count" className="flex-shrink-0">
                  {message.length} / 2000
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
