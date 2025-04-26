import './App.css';
import ChessGame from './components/ChessGame';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Chess vs AI</h1>
      </header>
      <main>
        <ChessGame />
      </main>
    </div>
  );
}

export default App;