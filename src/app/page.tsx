'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FileInfo {
  name: string;
  size: number;
  lastModified: string;
  url: string;
  contentType: string;
}

export default function HomePage() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/files');
      const data = await response.json();

      if (response.ok) {
        setFiles(data.files);
      } else {
        setError(data.error || 'ファイル一覧の取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const getFileIcon = (contentType: string) => {
    if (contentType?.includes('pdf')) return '📄';
    if (contentType?.includes('image')) return '🖼️';
    if (contentType?.includes('text')) return '📝';
    if (contentType?.includes('word')) return '📘';
    if (contentType?.includes('excel') || contentType?.includes('spreadsheet')) return '📊';
    return '📁';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">ファイル一覧を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">アップロードされたファイル一覧</h1>
        <div className="flex gap-4">
          <Link
            href="/upload"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            新しいファイルをアップロード
          </Link>
          <button
            onClick={fetchFiles}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            更新
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          エラー: {error}
        </div>
      )}

      {files.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <h2 className="text-xl text-gray-600 mb-2">アップロードされたファイルがありません</h2>
          <p className="text-gray-500 mb-4">最初のファイルをアップロードしてみましょう</p>
          <Link
            href="/upload"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors inline-block"
          >
            ファイルをアップロード
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-1 gap-0">
            {files.map((file, index) => (
              <div
                key={file.name}
                className={`p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${index === files.length - 1 ? 'border-b-0' : ''
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(file.contentType)}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{file.name}</h3>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {formatDate(file.lastModified)}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      表示
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-gray-500 text-sm">
        合計 {files.length} 個のファイル
      </div>
    </div>
  );
}
