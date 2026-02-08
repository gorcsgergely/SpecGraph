"use client";

import { useState } from "react";
import { useSearch } from "@/lib/hooks/use-graph";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useSearch(query);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Search</h1>
        <p className="text-muted-foreground text-sm">
          Search across all nodes by name and description
        </p>
      </div>
      <SearchBar value={query} onChange={setQuery} />
      {isLoading && (
        <p className="text-center text-muted-foreground">Searching...</p>
      )}
      {data && !isLoading && <SearchResults results={data} />}
      {!query && (
        <p className="text-center text-muted-foreground py-8">
          Start typing to search
        </p>
      )}
    </div>
  );
}
