import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, Calendar, Zap, Award, TrendingUp, ArrowRight } from "lucide-react";

interface Milestone {
  year: string;
  event: string;
  placing: string;
  description: string;
}

interface LegendProfile {
  id: string;
  name: string;
  handle: string;
  country: string;
  era: string;
  headline: string;
  bio: string;
  style: string;
  signaturePokemon: string[];
  achievements: string[];
  milestones: Milestone[];
  quote: string;
}

const LEGENDS: LegendProfile[] = [
  {
    id: "ray",
    name: "Ray Rizzo",
    handle: "@RayRizzoVGC",
    country: "United States",
    era: "2008–2016",
    headline: "The Three-Peat King — only player to win Worlds three times in a row",
    bio: "Ray Rizzo is the undisputed G.O.A.T. of VGC, winning World Championships in 2010, 2011, and 2012 with three completely different teams. His 2010 win with a Trick Room team featuring Cresselia and Hariyama shocked the world, and his follow-up victories cemented him as the greatest to ever play the format. Ray's ability to read the metagame and pilot unconventional picks — like using Thundurus and Metagross in an era dominated by weather teams — separated him from the pack. After retiring from competitive play, he became a commentator and one of the most respected voices in the community.",
    style: "Methodical and adaptive. Known for unconventional team choices, masterful positioning, and reading the metagame before it became obvious to everyone else. His teams always had a cohesive game plan with multiple win conditions.",
    signaturePokemon: ["Hydreigon", "Metagross", "Thundurus", "Cresselia", "Gastrodon"],
    achievements: [
      "2010 World Champion (Kona, Hawaii)",
      "2011 World Champion (San Diego, California)",
      "2012 World Champion (Kona, Hawaii)",
      "Multiple US National Championship top cuts",
      "Hall of Fame inductee",
    ],
    milestones: [
      { year: "2008", event: "VGC Debut", placing: "Top Cut", description: "Made his first deep run at US Nationals, announcing himself as a rising star." },
      { year: "2010", event: "World Championships", placing: "1st Place", description: "Won his first World title in Hawaii using Trick Room — a strategy most players dismissed as too slow." },
      { year: "2011", event: "World Championships", placing: "1st Place", description: "Defended his title with a weather-control team featuring Politoed and Ludicolo. Proved 2010 was no fluke." },
      { year: "2012", event: "World Championships", placing: "1st Place", description: "Completed the historic three-peat with a Metagross-Rotom-Wash core. Used Thundurus to dominate the speed tiers." },
      { year: "2013", event: "World Championships", placing: "Top 4", description: "Nearly made it four in a row — eliminated in semifinals but cemented his legend status forever." },
      { year: "2016", event: "World Championships", placing: "Competitor", description: "One of his final appearances as a competitor before transitioning to commentary and mentorship." },
    ],
    quote: "The best players don't just play the game — they play the opponent.",
  },
  {
    id: "wolfe",
    name: "Wolfe Glick",
    handle: "@WolfeyVGC",
    country: "United States",
    era: "2011–Present",
    headline: "The strategic mastermind who revolutionized VGC with Perish Trap",
    bio: "Wolfe Glick is one of the most analytical minds in VGC history. He won the 2016 World Championship with an iconic Raichu-Incineroar core and became famous for his Perish Trap Mega Gengar team that forced opponents into impossible positions. Beyond his competitive success, Wolfe is the most influential VGC content creator, with his YouTube channel teaching thousands of players the intricacies of competitive Pokémon. His ability to break down complex strategies into digestible lessons has inspired a generation of players. He also won the Players Cup, finished 2nd at the 2023 World Championships, and served as VGC coach for Team USA.",
    style: "Hyper-analytical and patient. Loves control strategies that limit the opponent's options — Perish Song, Trick Room, redirection. Excels at positional play and long-term game planning. His teambuilding is meticulous, covering every possible matchup.",
    signaturePokemon: ["Incineroar", "Raichu", "Mega Gengar", "Excadrill", "Dondozo"],
    achievements: [
      "2011 US National Champion (Junior Division)",
      "2012 US National Champion (Senior Division)",
      "2016 World Champion (Masters Division)",
      "2020 Players Cup Champion",
      "Multiple Regional Championships",
      "Largest VGC content creator (500K+ YouTube)",
    ],
    milestones: [
      { year: "2011", event: "US Nationals", placing: "1st (Juniors)", description: "Won his first national title in the Junior division, showcasing talent from a young age." },
      { year: "2012", event: "US Nationals", placing: "1st (Seniors)", description: "Moved up to Seniors and won again — back-to-back national champion across two age divisions." },
      { year: "2016", event: "World Championships", placing: "1st Place", description: "Won Masters Worlds with Raichu + Incineroar. Used Fake Out, Volt Switch, and Intimidate cycling to control the tempo of every game." },
      { year: "2020", event: "Players Cup", placing: "1st Place", description: "Won the online-era championship during the pandemic with a Coalossal steam-engine team." },
      { year: "2023", event: "World Championships", placing: "Top Cut", description: "Competed in the highly competitive Yokohama Worlds. Continued to be a top threat in every format he enters." },
      { year: "2025", event: "Content & Coaching", placing: "Icon", description: "YouTube surpasses 500K subscribers. Shapes the VGC metagame through analysis, coaching, and community leadership." },
    ],
    quote: "In VGC, information is everything. If you know what your opponent wants to do before they do it, you've already won.",
  },
  {
    id: "aaron",
    name: "Aaron Zheng",
    handle: "@CybertronVGC",
    country: "United States",
    era: "2012–Present",
    headline: "Cybertron — elite competitor turned the voice of competitive Pokémon",
    bio: "Aaron Zheng, known as Cybertron, is one of the most recognized faces in VGC. He placed 3rd at the 2013 World Championships and was a dominant force in the US competitive scene throughout the 2010s. His transition to content creation made him one of the community's most trusted voices — his road-to-ranked YouTube series is appointment viewing for competitive players, and his ability to explain decision-making in real time makes him one of the best teachers in the format. Aaron's calm, analytical approach to the game has educated thousands of players.",
    style: "Disciplined and fundamental. Relies on clean pivots, perfect EV spreads, and matchup knowledge. Doesn't take unnecessary risks — every turn is calculated. Known for piloting standard archetypes at the highest level and finding edges through preparation.",
    signaturePokemon: ["Zacian", "Incineroar", "Rillaboom", "Landorus-Therian", "Urshifu-Rapid"],
    achievements: [
      "3rd Place — 2013 World Championships (Vancouver)",
      "Multiple US National top cuts",
      "Multiple Regional Championships",
      "Over a decade of competitive VGC excellence",
      "One of the most influential VGC educators and commentators",
    ],
    milestones: [
      { year: "2012", event: "VGC Breakout", placing: "Top Competitor", description: "Burst onto the national scene with a strong competitive run, beginning the Cybertron era." },
      { year: "2013", event: "World Championships", placing: "3rd Place", description: "Placed 3rd at Worlds in Vancouver — his best-ever finish and a defining moment of his competitive career." },
      { year: "2014", event: "US Circuit", placing: "Top Competitor", description: "Continued to dominate the US circuit with consistent top finishes at Nationals and Regionals." },
      { year: "2016", event: "World Championships", placing: "Top Cut", description: "Top cut at Worlds during the Primal era — one of the most chaotic formats ever." },
      { year: "2019", event: "Transition to Content", placing: "Commentator", description: "Began focusing on content creation and commentary. His YouTube channel became a staple for competitive players." },
      { year: "2025", event: "Legacy", placing: "Voice of VGC", description: "CybertronVGC is one of the most respected voices in the community. Continues to educate and entertain through high-level gameplay breakdowns." },
    ],
    quote: "You don't win by making flashy plays. You win by making fewer mistakes than your opponent.",
  },
  {
    id: "sejun",
    name: "Sejun Park",
    handle: "@Sejun_Park",
    country: "South Korea",
    era: "2011–Present",
    headline: "The legend who won Worlds with a Pachirisu",
    bio: "Sejun Park is the embodiment of creativity in VGC. At the 2014 World Championships, he did the unthinkable — winning the whole tournament with a Pachirisu, a Pokémon most players considered completely unviable. His Follow Me + Volt Absorb support strategy became the stuff of legend, inspiring players worldwide to think outside the box. Sejun's win proved that deep understanding of mechanics and creative teambuilding can overcome raw stats. He was the first South Korean player to win a Masters World Championship, and his influence on VGC teambuilding continues to this day.",
    style: "Creative and unpredictable. Willing to use unconventional Pokémon if they fill a specific niche perfectly. Relies on redirection, support moves, and bulky setup sweepers. His teams are puzzles that opponents struggle to solve in best-of-three.",
    signaturePokemon: ["Pachirisu", "Garchomp", "Tyranitar", "Talonflame", "Milotic"],
    achievements: [
      "2014 World Champion (Washington, D.C.)",
      "First South Korean Masters World Champion",
      "Multiple Korean National top placements",
      "Pachirisu Hall of Fame (literally — a monument exists)",
    ],
    milestones: [
      { year: "2011", event: "Korean Circuit", placing: "Rising Star", description: "Started competing in South Korea's growing VGC scene, building a reputation for creative teams." },
      { year: "2013", event: "World Championships", placing: "Top Cut", description: "First major international result with a bulky Dragon-Ground-Fire core." },
      { year: "2014", event: "World Championships", placing: "1st Place", description: "Won Worlds with PACHIRISU. Follow Me + Volt Absorb absorbed Electric attacks aimed at Gyarados. Changed VGC history forever." },
      { year: "2016", event: "Continued Impact", placing: "Icon", description: "His Pachirisu became a cultural phenomenon — featured on merchandise, cards, and memorialized in the community." },
      { year: "2023", event: "Legacy", placing: "Legend", description: "Pachirisu received a special distribution event in South Korea celebrating Sejun's win. Still competing and inspiring new players." },
    ],
    quote: "There is no such thing as a bad Pokémon — only bad matchups. Find the right role, and anything can work.",
  },
  {
    id: "arash",
    name: "Arash Ommati",
    handle: "@MeanSitrus",
    country: "Italy",
    era: "2010–Present",
    headline: "The 2013 World Champion who ended Ray Rizzo's dynasty",
    bio: "Arash Ommati made history at the 2013 World Championships in Vancouver by defeating the legendary Ray Rizzo, ending his three-year reign as World Champion. Arash's victory was the first World Championship won by a European player in the Masters division, paving the way for the European VGC scene's rise to prominence. His meticulous teambuilding and calm under pressure became hallmarks of his play. Arash remains an active figure in the community and one of Europe's most respected VGC veterans.",
    style: "Meticulous and innovative. Pioneered unique team compositions built around specific matchup spreads. Known for deep metagame preparation and finding unconventional answers to dominant strategies.",
    signaturePokemon: ["Tyranitar", "Amoonguss", "Rotom-Wash", "Scizor", "Garchomp"],
    achievements: [
      "2013 World Champion (Vancouver, Canada)",
      "First European Masters World Champion in VGC",
      "Multiple Italian National top placements",
      "European VGC pioneer and community leader",
    ],
    milestones: [
      { year: "2010", event: "Italian Circuit", placing: "Rising Star", description: "Began competing in Italy's growing VGC scene, quickly establishing himself as a top player." },
      { year: "2012", event: "World Championships", placing: "Top Cut", description: "First major international result, signaling his arrival on the world stage." },
      { year: "2013", event: "World Championships", placing: "1st Place", description: "Won Worlds in Vancouver, defeating Ray Rizzo and ending the three-peat dynasty. Used a perfectly-crafted Tyranitar-Amoonguss team that dominated the field." },
      { year: "2014", event: "Defending Champion", placing: "Top Competitor", description: "Returned as defending champion. His 2013 win inspired a generation of European players." },
      { year: "2023", event: "Legacy", placing: "European Icon", description: "Recognized as the trailblazer who proved European players could win at the highest level. His Worlds victory remains a defining moment in VGC history." },
    ],
    quote: "Preparation beats talent when talent doesn't prepare. I studied every matchup until there were no surprises left.",
  },
  {
    id: "eduardo",
    name: "Eduardo Cunha",
    handle: "@EmbC_VGC",
    country: "Portugal",
    era: "2018–Present",
    headline: "The 2022 World Champion who mastered the art of the slow pace",
    bio: "Eduardo Cunha won the 2022 World Championship in London with a masterclass in bulky offense — piloting a Groudon-Zacian team through an elite field. His methodical, positional style contrasts with the hyper-offense trend, showing that patience and board control still reign supreme at the highest level. Eduardo's win was Portugal's first VGC Masters world title, and his calm demeanor under pressure has become his trademark. He continues to compete at the top level and mentor the next generation of European players.",
    style: "Bulky Offense — patient, positional. Wins through incremental advantages. Prefers bulk over speed and forces opponents to break his defensive core before they can win.",
    signaturePokemon: ["Groudon", "Zacian", "Gastrodon", "Incineroar", "Amoonguss"],
    achievements: [
      "2022 World Champion (London)",
      "First Portuguese World Champion in VGC",
      "Multiple European top placements",
    ],
    milestones: [
      { year: "2018", event: "European Circuit", placing: "Rising Competitor", description: "Started competing seriously, focusing on the European event circuit." },
      { year: "2021", event: "International Championships", placing: "Top Cut", description: "Made his first major international top cut, announcing himself as a serious contender." },
      { year: "2022", event: "World Championships", placing: "1st Place", description: "Won Worlds in London with Groudon-Zacian. Outplayed a field of legends with flawless positional play and perfect reads in the finals." },
      { year: "2023", event: "World Championships", placing: "Top Cut", description: "Continued his elite form, making another deep run with the next iteration of the format." },
      { year: "2025", event: "Legacy", placing: "World Champion", description: "Mentoring Portuguese and European VGC players. His Worlds win remains one of the most celebrated in European VGC history." },
    ],
    quote: "You don't need to be the fastest. You just need to be the last one standing.",
  },
];

export default function Legends() {
  const [selectedId, setSelectedId] = useState(LEGENDS[0]!.id);
  const legend = LEGENDS.find((l) => l.id === selectedId) ?? LEGENDS[0]!;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-yellow-400" />
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Hall of Legends</h1>
          <p className="text-sm text-muted-foreground mt-1">The iconic players who defined competitive Pokémon VGC</p>
        </div>
      </div>

      {/* Selector grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {LEGENDS.map((l) => (
          <button
            key={l.id}
            onClick={() => setSelectedId(l.id)}
            className={`text-left p-3 rounded-lg border transition-all ${
              selectedId === l.id
                ? "border-yellow-400/60 bg-yellow-400/10 ring-1 ring-yellow-400/30"
                : "border-border bg-black/20 hover:border-white/20"
            }`}
          >
            <div className="text-sm font-bold truncate">{l.name}</div>
            <div className="text-[10px] text-muted-foreground truncate">{l.country}</div>
          </button>
        ))}
      </div>

      {/* Profile detail */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          {/* Header */}
          <Card className="border-border overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500/10 via-red-500/10 to-blue-500/10 p-6 pb-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{legend.era} · {legend.country}</p>
                  <h2 className="text-3xl font-bold">{legend.name}</h2>
                  <p className="text-sm text-yellow-400/80 font-mono">{legend.handle}</p>
                </div>
                <div className="flex items-center gap-1 bg-yellow-400/10 px-3 py-1.5 rounded-full border border-yellow-400/20">
                  <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                  <span className="text-xs font-bold text-yellow-400">Legend</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic mt-2">{legend.headline}</p>
            </div>
            <CardContent className="p-6 pt-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{legend.bio}</p>

              <div className="mt-4 flex gap-3">
                <div className="flex items-start gap-1.5">
                  <Zap className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-blue-400/80 uppercase tracking-wider mb-1">Style</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{legend.style}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-yellow-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Career Timeline</h3>
              </div>
              <div className="relative pl-5 border-l-2 border-border space-y-4">
                {legend.milestones.map((m, i) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-[27px] w-3 h-3 rounded-full border-2 border-border ${
                      m.placing.includes("1st") || m.placing.includes("Champion")
                        ? "bg-yellow-400"
                        : m.placing.includes("Top") || m.placing.includes("Winner")
                          ? "bg-blue-400"
                          : "bg-muted-foreground/40"
                    }`} />
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground bg-black/20 px-1.5 py-0.5 rounded">{m.year}</span>
                          <span className="text-xs font-bold">{m.event}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                        m.placing.includes("1st") || m.placing.includes("Champion")
                          ? "bg-yellow-400/20 text-yellow-400"
                          : m.placing.includes("Top") || m.placing.includes("Winner") || m.placing.includes("Elite")
                            ? "bg-blue-400/20 text-blue-400"
                            : "bg-white/5 text-muted-foreground"
                      }`}>
                        {m.placing}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Achievements */}
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-4 w-4 text-yellow-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Achievements</h3>
              </div>
              <div className="space-y-2">
                {legend.achievements.map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Star className="h-3 w-3 text-yellow-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-muted-foreground">{a}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Signature Pokemon */}
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-red-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Signature Pokémon</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {legend.signaturePokemon.map((p) => (
                  <span key={p} className="text-[10px] bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full text-red-300">
                    {p}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quote */}
          <Card className="border-border bg-gradient-to-br from-yellow-500/5 to-transparent">
            <CardContent className="p-4">
              <p className="text-xs italic text-muted-foreground leading-relaxed">
                &ldquo;{legend.quote}&rdquo;
              </p>
              <p className="text-[10px] text-yellow-400/60 mt-2 font-bold">— {legend.name}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
