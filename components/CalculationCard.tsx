import React from 'react';
import { CalculationDetails } from '../types';
import { Calculator, Info, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface Props {
  details: CalculationDetails;
}

export const CalculationCard: React.FC<Props> = ({ details }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden my-4 max-w-2xl">
      {/* Header */}
      <div className="bg-medical-50 border-b border-medical-100 p-4 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-medical-600" />
        <h3 className="font-semibold text-medical-900">Statistical Calculation Result</h3>
      </div>

      <div className="p-5 space-y-6">
        {/* Main Result */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="text-center md:text-left">
                <p className="text-sm text-slate-500 uppercase tracking-wide font-medium">Sample Size Per Group</p>
                <div className="text-5xl font-bold text-medical-600 mt-1">{details.result}</div>
            </div>
            
            {details.totalSampleSize && (
                 <div className="text-center md:text-right bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Total Participants</p>
                    <div className="text-2xl font-semibold text-slate-700">{details.totalSampleSize}</div>
                </div>
            )}
        </div>

        <hr className="border-slate-100" />

        {/* Formula */}
        <div>
            <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Formula Used</span>
            </div>
            <div className="bg-slate-900 text-white p-4 rounded-lg overflow-x-auto">
                {/* We wrap with $$ for block math */}
                <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                        p: ({node, ...props}) => <div {...props} className="text-center text-lg" />
                    }}
                >
                    {`$$${details.formula}$$`}
                </ReactMarkdown>
            </div>
            <p className="text-xs text-slate-500 mt-2 italic">{details.description}</p>
        </div>

        {/* Parameters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
             {Object.entries(details.variables).map(([key, value]) => (
                 <div key={key} className="bg-slate-50 p-2 rounded border border-slate-100">
                     <span className="block text-xs text-slate-500">{key}</span>
                     <span className="block font-medium text-slate-800">{value}</span>
                 </div>
             ))}
        </div>

        {/* Assumptions */}
        {details.assumptions.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                 <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-700 uppercase">Assumptions</span>
                </div>
                <ul className="list-disc list-inside text-xs text-amber-800">
                    {details.assumptions.map(a => <li key={a}>{a}</li>)}
                </ul>
            </div>
        )}

      </div>
    </div>
  );
};