"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, Trash2, ExternalLink, Bookmark, Settings2, X, Edit2, Check } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('전체');
  
  // 초기값은 반드시 필요한 '전체'와 '미분류'만 설정합니다.
  const [categories, setCategories] = useState(['전체', '미분류']);
  const [showCatEditor, setShowCatEditor] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempCategory, setTempCategory] = useState('');

  // 데이터 로드 시 구형 카테고리를 강제로 필터링합니다.
  useEffect(() => {
    const savedLinks = localStorage.getItem('vibe-links');
    const savedCats = localStorage.getItem('vibe-cats');
    
    if (savedLinks) setLinks(JSON.parse(savedLinks));
    
    if (savedCats) {
      const parsedCats = JSON.parse(savedCats);
      // '디자인', '개발', '기능 정의', '기타' 단어가 포함된 경우 싹 제거합니다.
      const cleanedCats = parsedCats.filter((c: string) => 
        !['디자인', '개발', '기능 정의', '기타'].includes(c)
      );
      // '전체'와 '미분류'를 포함한 중복 없는 리스트를 만듭니다.
      const finalCats = Array.from(new Set(['전체', '미분류', ...cleanedCats]));
      setCategories(finalCats);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vibe-links', JSON.stringify(links));
    localStorage.setItem('vibe-cats', JSON.stringify(categories));
  }, [links, categories]);

  const autoTagCategory = (title: string) => {
    const keywords: { [key: string]: string[] } = {
      "디자인": ["디자인", "UI", "UX", "폰트", "컬러", "그래픽", "아트"],
      "개발": ["개발", "코딩", "Github", "API", "JS", "Python", "React", "기술"],
      "뉴스": ["뉴스", "소식", "보도", "신문", "기사"],
      "쇼핑": ["쇼핑", "구매", "가격", "스토어", "쿠팡", "무신사"],
      "도구": ["툴", "서비스", "생산성", "AI", "자동화", "업무"]
    };

    for (const [cat, words] of Object.entries(keywords)) {
      if (words.some(word => title.toLowerCase().includes(word.toLowerCase()))) {
        return cat;
      }
    }
    return "미분류";
  };

  const addLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    const targetUrl = url.startsWith('http') ? url : `https://${url}`;

    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();
      const pageTitle = data.title || targetUrl;
      const detectedCategory = autoTagCategory(pageTitle);

      if (detectedCategory !== "미분류" && !categories.includes(detectedCategory)) {
        setCategories(prev => [...prev, detectedCategory]);
      }

      const newLink: Reference = {
        id: Date.now().toString(),
        url: targetUrl,
        title: pageTitle,
        category: detectedCategory,
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
        category: "미분류",
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

  const saveCategoryChange = (id: string) => {
    setLinks(links.map(link => 
      link.id === id ? { ...link, category: tempCategory } : link
    ));
    setEditingId(null);
  };

  const addCategory = () => {
    if (!newCatName || categories.includes(newCatName)) return;
    setCategories([...categories, newCatName]);
    setNewCatName('');
  };

  const deleteCategory = (catName: string) => {
    if (catName === '전체' || catName === '미분류') return;
    if (confirm(`'${catName}' 카테고리를 삭제할까요?`)) {
      setCategories(categories.filter(c => c !== catName));
      setLinks(links.map(link => link.category === catName ? { ...link, category: '미분류' } : link));
      if (activeTab === catName) setActiveTab('전체');
    }
  };

  const filteredLinks = activeTab === '전체' ? links : links.filter(link => link.category === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-6">
        <h1 className="text-xl md:text-3xl font-bold mb-1 flex items-center gap-2 whitespace-nowrap">
          <Bookmark className="text-blue-600 w-5 h-5 md:w-6 md:h-6" /> My Refs Lab
        </h1>
        <p className="text-slate-500 text-xs md:text-base truncate">URL만 넣으면 자동 태깅되는 스마트 보관함</p>
      </header>

      <main className="max-w-6xl mx-auto">
        {showCatEditor && (
          <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-6 shadow-inner">
            <h2 className="font-bold mb-4 flex justify-between items-center text-blue-800 text-sm">
              카테고리 관리 
              <button onClick={() => setShowCatEditor(false)} className="text-blue-400"><X size={20}/></button>
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((cat) => (
                <div key={cat} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm text-sm font-medium">
                  <span>{cat}</span>
                  {cat !== '전체' && cat !== '미분류' && (
                    <button onClick={() => deleteCategory(cat)} className="text-red-300 hover:text-red-500"><Trash2 size={14} /></button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 bg-white p-2 rounded-xl border border-blue-100">
              <input 
                type="text" 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="직접 추가할 카테고리"
                className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
              />
              <button onClick={addCategory} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">추가</button>
            </div>
          </section>
        )}

        <section className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 mb-8 shadow-sm">
          <button 
            onClick={() => setShowCatEditor(!showCatEditor)}
            className="flex items-center gap-1.5 text-slate-500 mb-4 hover:text-blue-600 transition-colors"
          >
            <Settings2 size={14} /> 
            <span className="text-xs font-medium">카테고리 설정</span>
          </button>

          <form onSubmit={addLink} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <LinkIcon className="absolute left-3 top-3.5 text-slate-400 w-4 h-4 md:w-5 md:h-5" />
              <input
                type="text"
                placeholder="저장할 URL을 입력하세요"
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <button className="bg-blue-600 hover:bg-blue-500 transition-colors px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white text-sm">
              <Plus size={18} /> 저장하기
            </button>
          </form>
        </section>

        <nav className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-1.5 rounded-full whitespace-nowrap text-sm transition-all ${
                activeTab === tab 
                ? 'bg-blue-600 text-white font-bold' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredLinks.map((link) => (
            <div key={link.id} className="group bg-white border border-slate-200 rounded-2xl p-4 md:p-5 hover:border-blue-500/50 hover:shadow-lg transition-all relative">
              <div className="flex justify-between items-center mb-4">
                {editingId === link.id ? (
                  <div className="flex items-center gap-1">
                    <select 
                      className="text-[10px] bg-slate-100 border-none rounded px-1 py-0.5 outline-none"
                      value={tempCategory}
                      onChange={(e) => setTempCategory(e.target.value)}
                    >
                      {categories.filter(c => c !== '전체').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <button onClick={() => saveCategoryChange(link.id)} className="text-green-600"><Check size={14}/></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                      {link.category}
                    </span>
                    <button 
                      onClick={() => { setEditingId(link.id); setTempCategory(link.category); }}
                      className="text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 size={12} />
                    </button>
                  </div>
                )}
                
                <button onClick={() => deleteLink(link.id)} className="text-slate-300 hover:text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
              </div>
              
              <div className="w-full h-32 md:h-40 bg-slate-100 rounded-xl mb-4 overflow-hidden border border-slate-100 flex items-center justify-center">
                <img 
                  src={link.image || `https://www.google.com/s2/favicons?domain=${link.url}&sz=128`} 
                  alt="미리보기"
                  className={link.image ? "w-full h-full object-cover" : "w-10 h-10 object-contain opacity-50"}
                  onError={(e) => { 
                    e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${link.url}&sz=128`;
                    e.currentTarget.className = "w-10 h-10 object-contain opacity-50";
                  }}
                />
              </div>

              <h3 className="font-bold text-base md:text-lg mb-1 truncate text-slate-900">{link.title}</h3>
              <p className="text-slate-500 text-xs md:text-sm mb-4 truncate">{link.url}</p>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[10px] md:text-xs">{link.date}</span>
                <a href={link.url} target="_blank" className="text-blue-600 hover:text-blue-500 flex items-center gap-1 text-xs md:text-sm font-medium">
                  방문하기 <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}