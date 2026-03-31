'use client';

export default function CopyKeyButton({ keyText }: { keyText: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(keyText);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-gray-400 hover:text-gray-600"
      title="Скопировать"
      type="button"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </button>
  );
}