import React from 'react';
import { Message, Sender } from '../types';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { CalculationCard } from './CalculationCard';

interface Props {
  message: Message;
}

export const ChatMessage: React.FC<Props> = ({ message }) => {
  const isBot = message.sender === Sender.BOT;

  return (
    <div className={`flex w-full mb-6 ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] ${isBot ? 'flex-row' : 'flex-row-reverse'} gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isBot ? 'bg-medical-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
          {isBot ? <Bot size={18} /> : <User size={18} />}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
            <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                isBot 
                ? 'bg-white border border-slate-100 text-slate-800 rounded-tl-none' 
                : 'bg-medical-600 text-white rounded-tr-none'
            }`}>
                 {message.isThinking ? (
                    <div className="flex space-x-2 items-center h-5">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                 ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>
                            {message.text}
                        </ReactMarkdown>
                    </div>
                 )}
            </div>
            
            {/* Calculation Card (Only for Bot if present) */}
            {isBot && message.calculation && (
                <div className="w-full mt-2 animate-fade-in-up">
                    <CalculationCard details={message.calculation} />
                </div>
            )}
            
            <span className="text-[10px] text-slate-400 mt-1 px-1">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
      </div>
    </div>
  );
};