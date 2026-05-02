"use client";

import React, { useState, useEffect } from 'react';
// Search 아이콘이 제대로 불러와졌는지 확인해 주세요.
import { Plus, Link as LinkIcon, Trash2, ExternalLink, Bookmark, Settings2, X, Edit2, Check, Search } from 'lucide-react';

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
  const [categories, setCategories] = useState(['전체', '미분류']);
  const [showCatEditor, setShowCatEditor] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempCategory, setTempCategory] = useState('');
  
  // [체크!] 검색어 상태가 있는지 확인하세요.
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const savedLinks = localStorage.getItem('vibe-links');
    const savedCats = localStorage.getItem('vibe-cats');
    if (savedLinks) setLinks(JSON.parse(savedLinks));
    if (savedCats) {
      const parsedCats = JSON.parse(savedCats);
      const cleanedCats = parsedCats.filter((c: string) => !['디자인', '개발', '기능 정의', '기타'].includes(c));
      setCategories(Array.from(new Set(['전체', '미분류', ...cleanedCats])));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vibe-links', JSON.stringify(links));
    localStorage.setItem('vibe-cats', JSON.stringify(categories));
  }, [links, categories]);

  const autoTagCategory = (title: string, description: string, url: string) => {
    const combinedText = `${title} ${description} ${url}`.toLowerCase();
    const keywords: { [key: string]: string[] } = {
      "디자인": ["디자인", "design", "ui", "ux", "font", "color", "layout", "아이콘", "이미지", "포토샵", "피그마", "figma"],
      "개발": ["개발", "dev", "code", "coding", "github", "git", "api", "stack", "react", "next", "script", "엔지니어", "프로그래밍"],
      "뉴스": ["뉴스", "news", "보도", "기사", "journal", "브리핑", "소식"],
      "쇼핑": ["쇼핑", "shop", "스토어", "구매", "가격", "쿠팡", "네이버페이", "무신사", "market"],
      "도구": ["툴", "tool", "service", "ai", "자동화", "업무", "생산성", "플랫폼", "솔루션"],
      "블로그": ["blog", "velog", "tistory", "brunch", "포스트", "기록"]
    };
    for (const [cat, words] of Object.entries(keywords)) {
      if (words.some(word => combinedText.includes(word))) return cat;
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
      const detectedCategory = autoTagCategory(data.title || "", data.description || "", targetUrl);
      if (detectedCategory !== "미분류" && !categories.includes(detectedCategory)) {
        setCategories(prev => [...prev, detectedCategory]);
      }
      setLinks([{ id: Date.now().toString(), url: targetUrl, title: data.title || targetUrl, category: detectedCategory, date: new Date().toLocaleDateString(), image: data.image }, ...links]);
      setUrl('');
    } catch (error) {
      setLinks([{ id: Date.now().toString(), url: targetUrl, title: targetUrl, category: "미분류", date: new Date().toLocaleDateString() }, ...links]);
      setUrl('');
    }
  };

  const deleteLink = (id: string) => {
    if(confirm("정말 이 레퍼런스를 삭제할까요?")) setLinks(links.filter(link => link.id !== id));
  };

  const saveCategoryChange = (id: string) => {
    setLinks(links.map(link => link.id === id ? { ...link, category: tempCategory } : link));
    setEditingId(null);
  };

  // [체크!] 검색 필터링 로직이 활성화되어 있는지 확인하세요.
  const filteredLinks = links.filter(link => {
    const matchesTab = activeTab === '전체' || link.category === activeTab;
    const matchesSearch = 
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      link.url.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-6">
        <h1 className="text-xl md:text-3xl font-bold mb-1 flex items-center gap-2">
          <Bookmark className="text-blue-600 w-5 h-5 md:w-6 md:h-6" /> 나만의 레퍼런스 아카이브
        </h1>
        <p className="text-slate-500 text-xs md:text-base truncate">내용을 읽고 자동 분류하는 똑똑한 보관함</p>
      </header>

      <main className="max-w-6xl mx-auto">
        {showCatEditor && (
          <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-6 shadow-inner">
            <h2 className="font-bold mb-4 flex justify-between items-center text-blue-800 text-sm">카테고리 관리 <button onClick={() => setShowCatEditor(false)} className="text-blue-400"><X size={20}/></button></h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((cat) => (
                <div key={cat} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm text-sm font-medium">
                  <span>{cat}</span>
                  {cat !== '전체' && cat !== '미분류' && <button onClick={() => { if (cat === '전체' || cat === '미분류') return; if (confirm(`'${cat}' 카테고리를 삭제할까요?`)) { setCategories(categories.filter(c => c !== cat)); setLinks(links.map(link => link.category === cat ? { ...link, category: '미분류' } : link)); if (activeTab === cat) setActiveTab('전체'); } }} className="text-red-300 hover:text-red-500"><Trash2 size={14} /></button>}
                </div>
              ))}
            </div>
            <div className="flex gap-2 bg-white p-2 rounded-xl border border-blue-100">
              <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="직접 추가할 카테고리" className="flex-1 bg-transparent px-3 py-2 text-sm outline-none" />
              <button onClick={() => { if (!newCatName || categories.includes(newCatName)) return; setCategories([...categories, newCatName]); setNewCatName(''); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">추가</button>
            </div>
          </section>
        )}

        <section className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 mb-8 shadow-sm">
          <button onClick={() => setShowCatEditor(!showCatEditor)} className="flex items-center gap-1.5 text-slate-500 mb-4 hover:text-blue-600 transition-colors"><Settings2 size={14} /> <span className="text-xs font-medium">카테고리 설정</span></button>
          <form onSubmit={addLink} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative"><LinkIcon className="absolute left-3 top-3.5 text-slate-400 w-4 h-4 md:w-5 md:h-5" /><input type="text" placeholder="저장할 URL을 입력하세요" className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={url} onChange={(e) => setUrl(e.target.value)} /></div>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"><Plus size={18} /> 저장하기</button>
          </form>
        </section>

        {/* [체크!] 이 검색 바 코드가 실제 코드에 있는지 보세요. */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3 text-slate-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="링크 제목이나 주소로 검색해보세요"
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <nav className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-1.5 rounded-full whitespace-nowrap text-sm transition-all ${activeTab === tab ? 'bg-blue-600 text-white font-bold' : 'bg-white text-slate-600 border border-slate-200'}`}>{tab}</button>
          ))}
        </nav>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredLinks.length > 0 ? filteredLinks.map((link) => (
            <div key={link.id} className="group bg-white border border-slate-200 rounded-2xl p-4 md:p-5 hover:border-blue-500/50 hover:shadow-lg transition-all relative">
              <div className="flex justify-between items-center mb-4">
                {editingId === link.id ? (
                  <div className="flex items-center gap-1"><select className="text-[10px] bg-slate-100 border-none rounded px-1 py-0.5 outline-none" value={tempCategory} onChange={(e) => setTempCategory(e.target.value)}>{categories.filter(c => c !== '전체').map(c => (<option key={c} value={c}>{c}</option>))}</select><button onClick={() => saveCategoryChange(link.id)} className="text-green-600"><Check size={14}/></button></div>
                ) : (
                  <div className="flex items-center gap-2"><span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{link.category}</span><button onClick={() => { setEditingId(link.id); setTempCategory(link.category); }} className="text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={12} /></button></div>
                )}
                <button onClick={() => deleteLink(link.id)} className="text-slate-300 hover:text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
              </div>
              <div className="w-full h-32 md:h-40 bg-slate-100 rounded-xl mb-4 overflow-hidden border border-slate-100 flex items-center justify-center">
                <img src={link.image || `https://www.google.com/s2/favicons?domain=${link.url}&sz=128`} alt="미리보기" className={link.image ? "w-full h-full object-cover" : "w-10 h-10 object-contain opacity-50"} onError={(e) => { e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${link.url}&sz=128`; e.currentTarget.className = "w-10 h-10 object-contain opacity-50"; }} />
              </div>
              <h3 className="font-bold text-base md:text-lg mb-1 truncate text-slate-900">{link.title}</h3>
              <p className="text-slate-500 text-xs md:text-sm mb-4 truncate">{link.url}</p>
              <div className="flex justify-between items-center"><span className="text-slate-400 text-[10px] md:text-xs">{link.date}</span><a href={link.url} target="_blank" className="text-blue-600 hover:text-blue-500 flex items-center gap-1 text-xs md:text-sm font-medium">방문하기 <ExternalLink size={12} /></a></div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center text-slate-400">
              <Search className="mx-auto mb-4 opacity-20" size={48} />
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}