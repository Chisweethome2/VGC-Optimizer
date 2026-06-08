import React, { useState } from "react";
import { ARCHETYPES } from "@/data/archetypes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function Archetypes() {
  const archetypes = ARCHETYPES;
  const [filter, setFilter] = useState("");

  const filteredArchetypes = archetypes?.filter(a => 
    a.name.toLowerCase().includes(filter.toLowerCase()) || 
    a.category.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary uppercase">Meta Archetypes</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">Glossary of standard VGC strategies and counterplay.</p>
        </div>
        <div className="w-full md:w-72">
          <Input 
            placeholder="Filter archetypes..." 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="bg-card/50 border-primary/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredArchetypes?.map(arch => (
            <Card key={arch.id} className="border-border bg-card/50 backdrop-blur overflow-hidden flex flex-col">
              <div className="h-2 w-full bg-gradient-to-r from-primary to-transparent" />
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl text-foreground">{arch.name}</CardTitle>
                    <Badge variant="outline" className="mt-2 border-primary/30 text-primary uppercase text-[10px] tracking-widest">
                      {arch.category}
                    </Badge>
                  </div>
                  {arch.dangerLevel && (
                    <div className="flex items-center gap-1 text-destructive bg-destructive/10 px-2 py-1 rounded text-xs font-mono font-bold">
                      <AlertTriangle className="h-3 w-3" /> 
                      Threat Level {arch.dangerLevel}
                    </div>
                  )}
                </div>
                <CardDescription className="text-sm mt-4 text-foreground/80 leading-relaxed">
                  {arch.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 border-b border-border pb-1">Core Strategy</h4>
                  <p className="text-sm text-muted-foreground">{arch.coreStrategy}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 border-b border-border pb-1">Key Pokémon</h4>
                  <div className="flex flex-wrap gap-2">
                    {arch.keyPokemon.map((p, i) => (
                      <Badge key={i} variant="secondary" className="bg-black/30 hover:bg-primary/20 transition-colors cursor-default">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                    <h4 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Strengths
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {arch.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                  
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                    <h4 className="text-xs font-bold text-destructive uppercase tracking-widest mb-2 flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> Weaknesses
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {arch.weaknesses.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                </div>

                {arch.counterplay && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Counterplay</h4>
                    <p className="text-sm text-muted-foreground">{arch.counterplay}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {filteredArchetypes?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No archetypes match your filter.
            </div>
          )}
        </div>
    </div>
  );
}
