import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../src/context/authState';
import TrainCard from '../src/components/TrainCard';

export function renderCard(train, liveData, fareClass = 'economy') {
  return renderToStaticMarkup(
    <MemoryRouter>
      <AuthContext.Provider value={{ isAdmin: false }}>
        <TrainCard train={train} liveData={liveData} searchParams={{
          date: '2026-10-14', passengers: '1', fareClass,
        }} />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}
