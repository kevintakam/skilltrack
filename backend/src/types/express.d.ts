// Étend les types Express pour ajouter userId sur Request
// Ce fichier est automatiquement chargé par TypeScript

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export {};
