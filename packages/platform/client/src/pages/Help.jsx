import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, Users, Shield, HelpCircle, 
  Gamepad2, Eye, Trophy, MessageCircle
} from 'lucide-react';

const Help = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "How do I create a game session?",
      answer: "Sign in as an Operator or Admin, then go to the Operator Panel and click 'Create Session'. Select your game, add players, and start playing!"
    },
    {
      question: "What games are available?",
      answer: "Currently we support Teen Patti and Rummy. More games coming soon! Each game has its own rules and player limits."
    },
    {
      question: "How do players join a session?",
      answer: "Players can join active sessions by clicking on the session from the Games page. The session host (Operator) controls who can join."
    },
    {
      question: "Can I watch games without playing?",
      answer: "Yes! Use the 'Watch Live Games' feature to view ongoing sessions without participating."
    },
    {
      question: "How do I become an Operator?",
      answer: "Contact your Administrator to request Operator permissions. They can grant you access to create and manage game sessions."
    }
  ];

  const gameRules = [
    {
      game: "Teen Patti",
      icon: "♠",
      description: "A popular Indian card game similar to poker",
      rules: [
        "Each player gets 3 cards",
        "Players bet based on their hand strength",
        "Highest hand wins the pot",
        "Players can fold, call, or raise",
        "Bluffing is allowed and encouraged!"
      ]
    },
    {
      game: "Rummy",
      icon: "♦",
      description: "Form sets and sequences with your cards",
      rules: [
        "Each player gets 13 cards",
        "Form valid sets (3-4 of a kind) and sequences (3+ consecutive cards)",
        "Must have at least one pure sequence",
        "Draw and discard cards to improve your hand",
        "First to declare valid sets wins!"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 sticky top-0 z-50 bg-slate-900/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
              >
                <ArrowLeft size={24} className="text-slate-400" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-50">Help Center</h1>
                <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">Everything you need to know</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-4 sm:px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all text-sm sm:text-base"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-violet-500/20 rounded-full mb-4 sm:mb-6">
            <HelpCircle size={16} className="text-violet-400" />
            <span className="text-violet-300 text-xs sm:text-sm font-medium">How can we help?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-50 mb-4 sm:mb-6">
            Game Rules & Help
          </h2>
          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto px-4">
            Learn how to play, create sessions, and make the most of Funny Friends
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-12 sm:mb-16">
          {[
            { icon: Gamepad2, label: "Getting Started", color: "violet" },
            { icon: BookOpen, label: "Game Rules", color: "blue" },
            { icon: Users, label: "Multiplayer", color: "emerald" },
            { icon: Shield, label: "Security", color: "amber" }
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-800 rounded-xl p-3 sm:p-6 border border-slate-700 text-center hover:border-slate-600 transition-colors">
              <div className={`w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-3 bg-${item.color}-500/10 rounded-xl flex items-center justify-center`}>
                <item.icon size={20} className={`sm:w-6 sm:h-6 text-${item.color}-400`} />
              </div>
              <h3 className="font-bold text-slate-50 text-sm sm:text-base">{item.label}</h3>
            </div>
          ))}
        </div>

        {/* Game Rules Section */}
        <section className="mb-12 sm:mb-16">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-50 mb-6 sm:mb-8 flex items-center gap-2">
            <BookOpen size={24} className="text-violet-400" />
            Game Rules
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {gameRules.map((game, idx) => (
              <div key={idx} className="bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-slate-700">
                <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
                    {game.icon}
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-slate-50 mb-1">{game.game}</h4>
                    <p className="text-sm text-slate-400">{game.description}</p>
                  </div>
                </div>
                
                <ul className="space-y-2 sm:space-y-3">
                  {game.rules.map((rule, ruleIdx) => (
                    <li key={ruleIdx} className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base text-slate-300">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-violet-500 rounded-full mt-2 flex-shrink-0"></span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-12 sm:mb-16">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-50 mb-6 sm:mb-8 flex items-center gap-2">
            <MessageCircle size={24} className="text-violet-400" />
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700">
                <h4 className="font-bold text-slate-50 mb-2 text-sm sm:text-base">{faq.question}</h4>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-gradient-to-r from-violet-600 to-violet-800 rounded-xl sm:rounded-2xl p-6 sm:p-12 text-center">
          <Trophy size={40} className="mx-auto mb-4 sm:mb-6 text-white/80" />
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Ready to Play?</h3>
          <p className="text-violet-100 mb-6 sm:mb-8 max-w-xl mx-auto text-sm sm:text-base">
            Now that you know the rules, create an account and start playing with your friends!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="px-6 sm:px-8 py-3 bg-white text-violet-600 rounded-xl font-bold hover:bg-slate-100 transition-colors text-sm sm:text-base"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 sm:px-8 py-3 bg-violet-500/20 text-white border border-white/20 rounded-xl font-bold hover:bg-violet-500/30 transition-colors text-sm sm:text-base"
            >
              Browse Games
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12 sm:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">© 2026 Funny Friends. Play responsibly.</p>
            <div className="flex items-center gap-4 sm:gap-6">
              <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-300 text-sm">Home</button>
              <button onClick={() => navigate('/login')} className="text-slate-400 hover:text-slate-300 text-sm">Sign In</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Help;
