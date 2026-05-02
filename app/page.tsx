"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, Trash2, ExternalLink, Bookmark, Settings2, X } from 'lucide-react';

interface Reference {
  id: string;
  url: string;
  title: string;
  category: string;
  date: string;
  image?: string;
}

export default function LinkArchive() {
  const [links, setLinks] = useState<Reference[]>([]);
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('디자인');
  const [activeTab, setActiveTab] = useState('전체');
  
  const [categories, setCategories] = useState(['전체', '디자인', '개발', '기능 정의', '기타']);
  const [showCatEditor, setShowCatEditor] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // 데이터 로드
  useEffect(() => {
    const savedLinks = localStorage.getItem('vibe-links');
    const savedCats = localStorage.getItem('vibe-cats');
    if (savedLinks) setLinks(JSON.parse(savedLinks));
    if (savedCats) setCategories(JSON.parse(savedCats));
  }, []);

  // 데이터 저장
  useEffect(() => {
    localStorage.setItem('vibe-links', JSON.stringify(links));
    localStorage.setItem('vibe-cats', JSON.stringify(categories));
  }, [links, categories]);

  // 링크 추가 (서버 API 활용)
  const addLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    const targetUrl = url.startsWith('http') ? url : `https://${url}`;

    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();

      const newLink: Reference = {
        id: Date.now().toString(),
        url: targetUrl,
        title: data.title || targetUrl,
        category: category,
        date: new Date().toLocaleDateString(),
        image: data.image,
      };

      setLinks([newLink, ...links]);
      setUrl('');
    } catch (error) {
      const fallbackLink: Reference = {
        id: Date.now().toString(),
        url: targetUrl,
        title: targetUrl,
        category: category,
        date: new Date().toLocaleDateString(),
      };
      setLinks([fallbackLink, ...links]);
      setUrl('');
    }
  };

  const deleteLink = (id: string) => {
    if(confirm("정말 이 레퍼런스를 삭제할까요?")) {
      setLinks(links.filter(link => link.id !== id));
    }
  };

  const addCategory = () => {
    if (!newCatName || categories.includes(newCatName)) return;
    setCategories([...categories, newCatName]);
    setNewCatName('');
  };

  const deleteCategory = (catName: string) => {
    if (catName === '전체') return;
    if (confirm(`'${catName}' 카테고리를 삭제할까요?`)) {
      setCategories(categories.filter(c => c !== catName));
      if (activeTab === catName) setActiveTab('전체');
    }
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    if (index === 0) return;
    const newCats = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex <= 0 || targetIndex >= newCats.length) return;
    [newCats[index], newCats[targetIndex]] = [newCats[targetIndex], newCats[index]];
    setCategories(newCats);
  };

  const filteredLinks = activeTab === '전체' ? links : links.filter(link => link.category === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-12 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Bookmark className="text-blue-600" /> 나의 레퍼런스 보관함
          </h1>
          <p className="text-slate-600">주제별로 레퍼런스를 한눈에 확인하세요.</p>
        </div>
        <button 
          onClick={() => setShowCatEditor(!showCatEditor)}
          className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 transition-all shadow-sm"
        >
          <Settings2 size={18} /> 카테고리 관리
        </button>
      </header>

      <main className="max-w-6xl mx-auto">
        {/* 1. 카테고리 편집기 섹션 (중복 제거됨) */}
        {showCatEditor && (
          <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-10 shadow-inner">
            <h2 className="font-bold mb-4 flex justify-between items-center text-blue-800">
              카테고리 순서 및 편집 
              <button onClick={() => setShowCatEditor(false)} className="text-blue-400 hover:text-blue-600"><X size={20}/></button>
            </h2>
            <div className="flex flex-col gap-2 mb-6">
              {categories.map((cat, idx) => (
                <div key={cat} className="flex items-center justify-between bg-white px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
                  <span className="font-medium text-slate-700">{cat}</span>
                  <div className="flex items-center gap-2">
                    {cat !== '전체' && (
                      <>
                        <button onClick={() => moveCategory(idx, 'up')} className="p-1 hover:bg-blue-50 rounded text-blue-400 transition-colors">▲</button>
                        <button onClick={() => moveCategory(idx, 'down')} className="p-1 hover:bg-blue-50 rounded text-blue-400 transition-colors">▼</button>
                        <button onClick={() => deleteCategory(cat)} className="text-red-300 hover:text-red-500 p-1 ml-2 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 bg-white p-2 rounded-xl border border-blue-100">
              <input 
                type="text" 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="새 카테고리 이름"
                className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
              />
              <button onClick={addCategory} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all">추가</button>
            </div>
          </section>
        )}

        {/* 2. URL 입력 섹션 */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 mb-10 shadow-sm">
          <form onSubmit={addLink} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <LinkIcon className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="저장할 URL을 입력하세요"
                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 outline-none"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <select 
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.filter(c => c !== '전체').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button className="bg-blue-600 hover:bg-blue-500 transition-colors px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white">
              <Plus w-5 h-5 /> 저장하기
            </button>
          </form>
        </section>

        {/* 3. 카테고리 탭 메뉴 */}
        <nav className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full whitespace-nowrap transition-all ${
                activeTab === tab 
                ? 'bg-blue-600 text-white font-bold' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* 4. 카드 그리드 리스트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLinks.map((link) => (
            <div key={link.id} className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-500/50 hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded">{link.category}</span>
                <button onClick={() => deleteLink(link.id)} className="text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>
              </div>
              
              {/* 이미지 출력 (서버 데이터 우선 활용) */}
              <div className="w-full h-40 bg-slate-100 rounded-xl mb-4 overflow-hidden border border-slate-100 flex items-center justify-center">
                <img 
                  src={link.image || `https://www.google.com/s2/favicons?domain=${link.url}&sz=128`} 
                  alt="미리보기"
                  className={link.image ? "w-full h-full object-cover" : "w-12 h-12 object-contain opacity-50"}
                  onError={(e) => { 
                    e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${link.url}&sz=128`;
                    e.currentTarget.className = "w-12 h-12 object-contain opacity-50";
                  }}
                />
              </div>

              <h3 className="font-bold text-lg mb-1 truncate text-slate-900">{link.title}</h3>
              <p className="text-slate-500 text-sm mb-4 truncate">{link.url}</p>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">{link.date}</span>
                <a href={link.url} target="_blank" className="text-blue-600 hover:text-blue-500 flex items-center gap-1 text-sm font-medium">
                  방문하기 <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}