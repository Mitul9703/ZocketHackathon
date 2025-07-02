import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, UnstructuredMarkdownLoader, TextLoader
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

def load_and_process_pdfs(pdf_folder_path):
    documents = []
    for file in os.listdir(pdf_folder_path):
        if file.endswith('crisp.txt'):
            txt_path = os.path.join(pdf_folder_path, file)
            print(txt_path)
            loader = TextLoader(txt_path, encoding='utf-8')
            print(loader.load())
            documents.extend(loader.load())

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(documents)
    return splits

embeddings = OpenAIEmbeddings(model="text-embedding-3-small", api_key=os.getenv("OPENAI_API_KEY"))
vector_store = Chroma(
    collection_name="zocket_collectionV3",
    embedding_function=embeddings,
    persist_directory="../chroma_langchain_dbV3", 
)
splits = load_and_process_pdfs(r"PATH_TO_DOCUMENTS_FOLDER")
for doc in splits:
    doc.metadata["document_type"] = "troubleshooting"
vector_store.add_documents(splits)


results = vector_store.similarity_search(
"Does my ad not comply with policy?",
k=3,
)
print(results)
for res in results:
    print(f"Page Content: {res.page_content}")
    print(f"Metadata: {res.metadata}")
    print("--------------------------------")