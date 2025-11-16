
import React from 'react';
import { Message, Sender } from '../types';
import { UserIcon, AIIcon } from './IconComponents';

interface MessageProps {
  message: Message;
  onRetry?: (originalText: string, errorMsgId: string) => void;
  userLogo?: string | null;
}

const MessageComponent: React.FC<MessageProps> = ({ message, onRetry, userLogo }) => {
  const isUser = message.sender === Sender.User;

  const containerClasses = isUser ? 'flex items-end justify-end' : 'flex items-end';

  const bubbleClasses = isUser
    ? 'bg-fuchsia-500 border-fuchsia-500/50 text-white' // User message is consistently styled for brand identity
    : message.isError 
    ? 'bg-red-100 dark:bg-red-600/30 border-red-300 dark:border-red-500/50 text-red-900 dark:text-gray-200'
    : 'bg-gray-200 dark:bg-cyan-600/20 border-gray-300 dark:border-cyan-500/50 text-gray-800 dark:text-gray-200';

  const formattedText = message.text.split('\n').map((line, index) => (
    <span key={index}>
      {line.startsWith('- ') ? `• ${line.substring(2)}` : line}
      <br />
    </span>
  ));

  const handleRetryClick = () => {
    if (onRetry && message.originalText) {
      onRetry(message.originalText, message.id);
    }
  }

  return (
    <div className={containerClasses}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center mr-3 border border-cyan-200 dark:border-cyan-500/30 overflow-hidden">
          {userLogo ? (
            <img src={userLogo} alt="Company logo" className="w-full h-full object-contain p-1" />
          ) : (
            <AIIcon />
          )}
        </div>
      )}
      <div className={`max-w-md lg:max-w-xl p-4 rounded-2xl border ${bubbleClasses} transition-all duration-300`}>
        {message.imageUrl ? (
            <div className="space-y-3">
                <p className="whitespace-pre-wrap">{formattedText}</p>
                {message.imagePrompt && <p className="text-sm text-gray-500 dark:text-gray-400 italic border-l-2 border-gray-400 dark:border-gray-500 pl-2">"{message.imagePrompt}"</p>}
                <img src={message.imageUrl} alt={message.imagePrompt || 'Generated image'} className="rounded-lg border border-cyan-300 dark:border-cyan-500/30" />
            </div>
        ) : (
            <p className="whitespace-pre-wrap">{formattedText}</p>
        )}
        {message.isError && onRetry && (
          <button
            onClick={handleRetryClick}
            className="mt-3 text-sm font-semibold bg-cyan-500 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-600 dark:hover:bg-cyan-500/80 transition-colors duration-300"
          >
            Retry
          </button>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-fuchsia-100 dark:bg-fuchsia-500/20 flex items-center justify-center ml-3 border border-fuchsia-200 dark:border-fuchsia-500/30">
          <UserIcon />
        </div>
      )}
    </div>
  );
};

export default MessageComponent;