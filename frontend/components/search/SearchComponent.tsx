'use client';

import React, {useState, useEffect, useRef, useMemo} from 'react';
import { X, Filter, Loader2, Image, Folder, Search} from 'lucide-react';
import {useRouter} from 'next/navigation';
import type {Collection, SearchResult, SearchFilters} from '@/types';
import {SearchEngine, highlightSearchTerm, truncateText} from '@/services/SearchService';
import {ROUTES} from "@/config/routes";

interface SearchComponentProps {
    collections: Collection[];
    placeholder?: string;
    maxResults?: number;
    className?: string;
}

export default function SearchComponent({
                                            collections,
                                            placeholder = "SearchComponent collections and NFTs...",
                                            maxResults = 8,
                                            className = ""
                                        }: SearchComponentProps) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({
        type: 'all',
        sortBy: 'relevance'
    });

    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const searchEngine = useMemo(() => new SearchEngine(collections), [collections]);

    useEffect(() => {
        searchEngine.updateCollections(collections);
    }, [collections, searchEngine]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setShowResults(false);
            return;
        }

        const searchTimeout = setTimeout(async () => {
            setIsSearching(true);

            try {
                const searchResults = await searchEngine.search(query, {
                    type: filters.type,
                    maxResults
                });
                setResults(searchResults);
                setShowResults(true);
            } catch (error) {
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(searchTimeout);
    }, [query, filters, searchEngine, maxResults]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleResultClick = (result: SearchResult) => {
        console.log('🔍 Result clicked:', result);
        setShowResults(false);
        setQuery('');

        if (result.type === 'collection') {
            router.push(`${ROUTES.COLLECTIONS}/${result.collectionId}`);
        } else if (result.type === 'nft') {
            router.push(`${ROUTES.COLLECTIONS}/${result.collectionId}?nft=${result.tokenId}`);
        }
    };

    const clearSearch = () => {
        console.log('🔍 Clearing search');
        setQuery('');
        setResults([]);
        setShowResults(false);
        inputRef.current?.focus();
    };

    const getResultIcon = (type: string) => {
        switch (type) {
            case 'collection':
                return <Folder className="w-4 h-4 text-blue-400"/>;
            case 'nft':
                return <Image className="w-4 h-4 text-purple-400"/>;
            default:
                return <Search className="w-4 h-4 text-gray-400"/>;
        }
    };

    const getResultTypeLabel = (type: string) => {
        switch (type) {
            case 'collection':
                return 'Collection';
            case 'nft':
                return 'NFT';
            default:
                return '';
        }
    };

    return (
        <div ref={searchRef} className={`relative ${className}`}>
            {/* SearchComponent Input */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isSearching ? (
                        <Loader2 className="h-5 w-5 text-gray-400 animate-spin"/>
                    ) : (
                        <Search className="h-5 w-5 text-gray-400"/>
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query && setShowResults(true)}
                    className="w-full pl-10 pr-10 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={placeholder}
                />

                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                    >
                        <X className="h-5 w-5"/>
                    </button>
                )}
            </div>

            {/* SearchComponent Results Dropdown */}
            {showResults && (
                <div
                    className="absolute top-full left-0 right-0 mt-1 bg-gray-900/98 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl z-[100]">
                    {/* Filter Options */}
                    <div className="p-3 border-b border-gray-700">
                        <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-gray-400"/>
                            <span className="text-sm text-gray-400">Filter:</span>
                            <div className="flex space-x-1">
                                {[
                                    {key: 'all', label: 'All'},
                                    {key: 'collections', label: 'Collections'},
                                    {key: 'nfts', label: 'NFTs'}
                                ].map((option) => (
                                    <button
                                        key={option.key}
                                        onClick={() => setFilters({...filters, type: option.key as any})}
                                        className={`px-2 py-1 text-xs rounded ${
                                            filters.type === option.key
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SearchComponent Results */}
                    <div className="max-h-96 overflow-y-auto">
                        {results.length === 0 ? (
                            <div className="p-4 text-center">
                                <p className="text-gray-400 text-sm">
                                    {isSearching ? 'Searching...' : 'No results found'}
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                    Try searching for collection names, NFT names, or token IDs
                                </p>
                            </div>
                        ) : (
                            <div className="py-2">
                                {results.map((result) => (
                                    <button
                                        key={result.id}
                                        onClick={() => handleResultClick(result)}
                                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left"
                                    >
                                        {/* Result Image */}
                                        <div className="flex-shrink-0">
                                            <img
                                                src={result.imageUrl}
                                                alt={result.title}
                                                className="w-10 h-10 rounded-lg object-cover border border-gray-600"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = result.type === 'collection'
                                                        ? '/placeholder-collection.png'
                                                        : '/placeholder-nft.png';
                                                }}
                                            />
                                        </div>

                                        {/* Result Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                                {getResultIcon(result.type)}
                                                <h4
                                                    className="text-sm font-medium text-white truncate"
                                                    dangerouslySetInnerHTML={{
                                                        __html: highlightSearchTerm(result.title, query)
                                                    }}
                                                />
                                                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                          {getResultTypeLabel(result.type)}
                        </span>
                                            </div>
                                            <p className="text-xs text-gray-400 truncate">
                                                {result.subtitle}
                                            </p>
                                            {result.description && (
                                                <p
                                                    className="text-xs text-gray-500 mt-1 truncate"
                                                    dangerouslySetInnerHTML={{
                                                        __html: highlightSearchTerm(
                                                            truncateText(result.description, 80),
                                                            query
                                                        )
                                                    }}
                                                />
                                            )}
                                        </div>

                                        {/* Result Action Indicator */}
                                        <div className="flex-shrink-0">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SearchComponent Footer */}
                    {results.length > 0 && (
                        <div className="p-3 border-t border-gray-700 bg-gray-800/50">
                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <span>{results.length} result{results.length !== 1 ? 's' : ''} found</span>
                                <span>Click to navigate</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 