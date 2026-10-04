import ReactMarkdown from 'react-markdown'

const unwrapMarkdownFence = (content) => {
  if (typeof content !== 'string') return ''

  const match = content.match(/^\s*```(?:markdown|md)\s*\n([\s\S]*?)\n```\s*$/i)
  return match ? match[1] : content
}

export default function MarkdownContent({ content, className = '' }) {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-3 text-slate-900" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3 text-slate-900" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2 text-slate-900" {...props} />,
          h4: ({ node, ...props }) => <h4 className="text-base font-semibold mt-3 mb-2 text-slate-900" {...props} />,
          p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc ml-6 mb-4 space-y-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal ml-6 mb-4 space-y-2" {...props} />,
          li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-slate-900" {...props} />,
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-600 my-4" {...props} />,
          code: ({ node, ...props }) => <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-slate-800" {...props} />,
          pre: ({ node, ...props }) => <pre className="bg-slate-100 p-4 rounded-lg text-sm font-mono text-slate-800 overflow-x-auto my-4" {...props} />,
          hr: ({ node, ...props }) => <hr className="my-6 border-slate-300" {...props} />,
          a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" {...props} />,
        }}
      >
        {unwrapMarkdownFence(content)}
      </ReactMarkdown>
    </div>
  )
}
