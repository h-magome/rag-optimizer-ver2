# RAG Optimizer ver2
Azure Cognitive Services、Azure Blob Storage、Azure AI Searchを活用したRAG（Retrieval-Augmented Generation）システムです。ファイルのアップロード、OCR処理、セマンティックチャンキング、ベクトル検索を行い、チャットインターフェースで質問応答を提供します。

## 🚀 主な機能

- **ファイル管理**
  - Azure Blob Storageへのファイルアップロード
  - アップロード済みファイルの一覧表示・ダウンロード
  - PDF、画像ファイル対応

- **ドキュメント処理**
  - Azure Form Recognizerによる高精度OCR
  - OpenAI APIを使用したセマンティックチャンキング
  - Azure AI Searchへのベクトル埋め込み保存

- **RAGシステム**
  - セマンティック検索による関連文書の取得
  - OpenAI GPTモデルによる文脈を考慮した回答生成
  - リアルタイムチャットインターフェース

## 📁 プロジェクト構成
```
ragoptimizer/
├── src/
│   └── app/
│       ├── page.tsx                # ファイル一覧表示ページ
│       ├── layout.tsx              # アプリケーション共通レイアウト(メニューバー)
│       ├── globals.css             # グローバルスタイル
│       ├── favicon.ico             # ファビコン
│       ├── upload/
│       │   └── page.tsx            # ファイルアップロード・処理ページ
│       ├── chat/
│       │   └── page.tsx            # チャットインターフェース
│       └── api/
│           ├── files/
│           │   └── route.ts        # ファイル一覧取得API
│           ├── upload/
│           │   └── route.ts        # ファイルアップロードAPI
│           ├── ocr/
│           │   └── route.ts        # OCR処理API
│           ├── semantic-chunk/
│           │   └── route.ts        # セマンティックチャンキングAPI
│           ├── ingest/
│           │   └── route.ts        # ベクトルDB登録API
│           └── chat/
│               └── route.ts        # チャット応答API
├── public/                         # 静的ファイル
├── package.json                    # 依存関係とスクリプト
├── tsconfig.json                   # TypeScript設定
├── next.config.ts                  # Next.js設定
├── postcss.config.mjs              # PostCSS設定
├── eslint.config.mjs               # ESLint設定
└── README.md                       # このファイル
```

## フロントエンドコンポーネント
```
app/page.tsx
機能: アップロード済みファイルの一覧表示・ダウンロード
主な処理:
/api/files でファイル一覧取得
ファイルタイプ別アイコン表示、ファイルサイズ・日時のフォーマット
ファイルの表示・ダウンロード機能
UI要素: ファイル一覧、アップロードページへのリンク、更新ボタン
```

```
app/upload/page.tsx
機能: ファイル選択・アップロード → OCR → 意味チャンク化 → ベクトル登録 までのステップを一画面で操作
主な処理:
/api/upload で Blob Storage にファイル保存
/api/ocr で Azure Document Intelligence によるテキスト抽出
/api/semantic-chunk で GPT-4o-mini に意味単位チャンク生成依頼
/api/ingest で text-embedding-3-small による埋め込み生成＆Azure Cognitive Search 登録
```

```
app/chat/page.tsx
機能: 登録済みドキュメントを検索して ChatGPT で回答
主な処理:
ユーザー質問を /api/chat に POST
ベクトル検索 → 上位コンテキスト取得 → GPT-4o-mini で応答生成
UI要素: 質問入力欄、回答表示ログ
```

## API Routes
```
/api/files/route.ts
入力: なし（GET リクエスト）
処理: Azure Blob Storage からファイル一覧を取得、最新順でソート
出力: { files: FileInfo[] }
```

```
/api/upload/route.ts
入力: PDF もしくは画像ファイル
処理: Azure Blob Storage へのアップロード（SAS URL 生成）
出力: { url: string }
```

```
/api/ocr/route.ts
入力: { url: string }
処理: Azure Document Intelligence の prebuilt‐layout/read モデル呼び出し
出力: { paragraphs: string[] }
```

```
/api/semantic-chunk/route.ts
入力: { paragraphs: string[] }
処理: GPT-4o-mini にプロンプト投げ → 意味チャンクを JSON 返却
出力: { chunks: string[] }
```

```
/api/ingest/route.ts
入力: { chunks: { chunk: string; index: number }[], sourceId: string }
処理:
text-embedding-3-small で埋め込み生成
sourceId を Base64 URL-safe 化
Azure Cognitive Search へアップサート
出力: { ingested: number }
```

```
/api/chat/route.ts
入力: { question: string }
処理:
質問を埋め込み化
Azure Cognitive Search で k-NN 検索
上位コンテキストを結合
GPT-4o-mini で回答生成
出力: { answer: string }
```

## 🛠 技術スタック

### フロントエンド
- **Next.js 15.3.2** - React フレームワーク（App Router使用）
- **React 19** - UIライブラリ
- **TypeScript 5** - 型安全なJavaScript
- **TailwindCSS 4** - ユーティリティファーストCSSフレームワーク

### バックエンド・インフラ
- **Azure Blob Storage** - ファイルストレージ
- **Azure Form Recognizer** - OCR処理
- **Azure AI Search** - ベクトル検索エンジン
- **OpenAI API** - セマンティックチャンキング・チャット応答

### 開発ツール
- **ESLint** - コード品質管理
- **PostCSS** - CSS後処理

## 📋 前提条件

- Node.js 18以上
- npm
- Azure サブスクリプション

## 🔧 環境変数設定

`env.exapmle`を参照し、プロジェクトルートに `.env.local` ファイルを作成して環境変数を設定してください


## 🚀 セットアップ・起動

1. **依存関係のインストール**
```bash
npm install
```

2. **開発サーバーの起動**
```bash
npm run dev
```

3. **ブラウザでアクセス**
```
http://localhost:3000
```

## 📖 使用方法

### 1. ファイルアップロード・処理
1. `/upload` ページにアクセス
2. PDF または画像ファイルを選択
3. 「アップロードして処理を開始」ボタンをクリック
4. 以下の処理が自動的に実行されます：
   - Azure Blob Storageへのアップロード
   - Azure Form RecognizerによるOCR処理
   - OpenAI APIによるセマンティックチャンキング
   - Azure AI Searchへのベクトル埋め込み保存

### 2. ファイル一覧確認
1. `/` （ホームページ）にアクセス
2. アップロード済みファイルの一覧を確認
3. ファイルの表示・ダウンロードが可能

### 3. チャット
1. `/chat` ページにアクセス
2. 処理済みドキュメントに関する質問を入力
3. AIが関連文書を検索して回答を生成

## 🔄 API エンドポイント
```
| エンドポイント | メソッド | 説明 |
|---|---|---|
| `/api/files` | GET | アップロード済みファイル一覧の取得 |
| `/api/upload` | POST | ファイルのアップロード |
| `/api/ocr` | POST | OCR処理の実行 |
| `/api/semantic-chunk` | POST | セマンティックチャンキングの実行 |
| `/api/ingest` | POST | ベクトルDBへの保存 |
| `/api/chat` | POST | チャット応答の生成 |
```

## 🏗 アーキテクチャ

```
[ユーザー] 
    ↓
[Next.js フロントエンド]
    ↓
[API Routes]
    ↓
┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐
│ Azure Blob      │ │ Azure Form       │ │ Azure AI Search │
│ Storage         │ │ Recognizer       │ │                 │
│ (ファイル保存)    │ │ (OCR処理)         │ │ (ベクトル検索)    │
└─────────────────┘ └──────────────────┘ └─────────────────┘
                              │
                              ↓
                    ┌──────────────────┐
                    │ OpenAI API       │
                    │ (チャンキング・    │
                    │  回答生成)        │
                    └──────────────────┘
```

