import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Sender } from '../types';
import { initializeChat, sendMessageStream, generateImage } from '../services/geminiService';
import type { Chat } from '@google/genai';
import ChatInput from './ChatInput';
import MessageComponent from './Message';
import { LoadingIcon } from './IconComponents';

const ChatPanel: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'init-1',
            text: "Welcome to Bona Parks! I am Bonus, your AI concierge. How can I help you explore our virtual experiences today?",
            sender: Sender.AI,
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [userLogo, setUserLogo] = useState<string | null>(null);
    const chat = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        chat.current = initializeChat();
        const savedLogo = localStorage.getItem('user-logo');
        if (savedLogo) {
            setUserLogo(savedLogo);
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const executeImageGeneration = useCallback(async (prompt: string) => {
        setIsLoading(true);
        const aiMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, {
            id: aiMessageId,
            text: `🎨 Generating an image for: "${prompt}"`,
            sender: Sender.AI,
            imagePrompt: prompt,
        }]);

        try {
            const imageUrl = await generateImage(prompt);

            setMessages(prev =>
                prev.map(msg =>
                    msg.id === aiMessageId ? {
                        ...msg,
                        text: "Here is the image you requested.",
                        imageUrl: imageUrl,
                    } : msg
                )
            );
        } catch (error) {
            console.error("Error generating image:", error);
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === aiMessageId ? {
                        ...msg,
                        text: "Sorry, I couldn't create that image. The prompt may be too complex or unsafe. Please try a different idea.",
                        isError: true,
                        originalText: `/imagine ${prompt}`
                    } : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    const executeStream = useCallback(async (text: string) => {
        if (!chat.current) return;
        setIsLoading(true);
        const aiMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: Sender.AI }]);

        try {
            const stream = await sendMessageStream(chat.current, text);
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === aiMessageId ? { ...msg, text: msg.text + chunkText } : msg
                    )
                );
            }
        } catch (error) {
            console.error("Error streaming response:", error);
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === aiMessageId ? {
                        ...msg,
                        text: "My apologies, an error occurred.",
                        isError: true,
                        originalText: text
                    } : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSend = useCallback(async (inputText: string) => {
        if (!inputText.trim() || isLoading) return;

        const userMessage: Message = { id: Date.now().toString(), text: inputText, sender: Sender.User };
        setMessages(prev => [...prev, userMessage]);
        
        if (inputText.trim().startsWith('/imagine ')) {
            const prompt = inputText.trim().substring(9);
            await executeImageGeneration(prompt);
        } else {
            await executeStream(inputText);
        }
    }, [isLoading, executeStream, executeImageGeneration]);

    const handleRetry = useCallback(async (originalText: string, errorMsgId: string) => {
        if (isLoading) return;
        setMessages(prev => prev.filter(msg => msg.id !== errorMsgId));
        
        if (originalText.trim().startsWith('/imagine ')) {
            const prompt = originalText.trim().substring(9);
            await executeImageGeneration(prompt);
        } else {
            await executeStream(originalText);
        }
    }, [isLoading, executeStream, executeImageGeneration]);

    return (
        <div className="w-full max-w-3xl h-[80vh] flex flex-col bg-white/70 dark:bg-black/50 backdrop-blur-lg rounded-xl shadow-2xl shadow-cyan-500/10 border border-gray-300 dark:border-gray-700/50 overflow-hidden">
            <div className="flex-grow p-6 overflow-y-auto space-y-6">
                {messages.map(msg => (
                    <MessageComponent key={msg.id} message={msg} onRetry={handleRetry} userLogo={userLogo} />
                ))}
                {isLoading && messages[messages.length-1].sender === Sender.AI && (
                    <div className="flex items-center space-x-3 animate-pulse">
                         <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center border border-cyan-200 dark:border-cyan-500/30">
                            <LoadingIcon />
                        </div>
                        <div className="w-16 h-4 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-300 dark:border-gray-700/50">
                <ChatInput onSend={handleSend} isLoading={isLoading} />
            </div>
        </div>
    );
};

export default ChatPanel;