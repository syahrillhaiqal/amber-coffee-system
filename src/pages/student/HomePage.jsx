import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center bg-secondary">
      <div className="w-full max-w-md space-y-6">
        <img 
          src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80" 
          alt="Coffee" 
          className="w-full h-64 object-cover rounded-2xl shadow-lg rotate-1"
        />

        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
          Fuel Your Study <span className="text-primary">Session</span>
        </h1>
        
        <p className="text-gray-600 text-lg">
          Welcome to Amber Coffee! We deliver fresh brews directly to you with love. 
          Skip the walk, keep the focus.
        </p>

        <Link 
          to="/trip" 
          className="block w-full py-4 bg-primary text-white text-lg font-bold rounded-xl shadow-lg shadow-orange-200 active:scale-95 transition-transform"
        >
          Let's Order Now
        </Link>
      </div>
    </div>
  );
}