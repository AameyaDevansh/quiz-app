import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectMongo } from "../config/mongo";
import { Quiz } from "../models/Quiz.model";

interface SeedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  type: "MCQ";
  timeLimit: number;
  points: number;
}

const mcq = (question: string, options: string[], correctAnswer: string): SeedQuestion => ({
  question,
  options,
  correctAnswer,
  type: "MCQ",
  timeLimit: 20,
  points: 1000,
});

interface GenreQuiz {
  title: string;
  description: string;
  questions: SeedQuestion[];
}

const GENRE_QUIZZES: Record<string, GenreQuiz> = {
  general: {
    title: "General Knowledge Trivia",
    description: "A broad mix of everyday trivia — a bit of everything.",
    questions: [
      mcq("What is the capital of France?", ["Paris", "Rome", "Berlin", "Madrid"], "Paris"),
      mcq("How many continents are there on Earth?", ["5", "6", "7", "8"], "7"),
      mcq("What is the chemical symbol for water?", ["H2O", "CO2", "O2", "NaCl"], "H2O"),
      mcq("Which planet is known as the Red Planet?", ["Venus", "Mars", "Jupiter", "Saturn"], "Mars"),
      mcq("What is the largest ocean on Earth?", ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"], "Pacific Ocean"),
      mcq("How many colors are in a rainbow?", ["5", "6", "7", "8"], "7"),
      mcq("What is the smallest prime number?", ["0", "1", "2", "3"], "2"),
      mcq("What is the freezing point of water in Celsius?", ["0", "32", "100", "-1"], "0"),
      mcq("Which organ pumps blood through the human body?", ["Lungs", "Liver", "Heart", "Kidney"], "Heart"),
      mcq("What is the tallest mountain in the world?", ["K2", "Kangchenjunga", "Mount Everest", "Denali"], "Mount Everest"),
      mcq("How many days are there in a leap year?", ["364", "365", "366", "367"], "366"),
      mcq("What is the currency used in Japan?", ["Won", "Yuan", "Yen", "Ringgit"], "Yen"),
      mcq("Which gas do plants absorb from the atmosphere?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], "Carbon dioxide"),
      mcq("What is the largest mammal in the world?", ["African elephant", "Blue whale", "Giraffe", "Polar bear"], "Blue whale"),
      mcq("How many sides does a hexagon have?", ["5", "6", "7", "8"], "6"),
      mcq("What is the hardest natural substance on Earth?", ["Gold", "Iron", "Diamond", "Quartz"], "Diamond"),
      mcq("Which is the largest planet in our solar system?", ["Earth", "Saturn", "Jupiter", "Neptune"], "Jupiter"),
    ],
  },

  geography: {
    title: "Geography Trivia",
    description: "Countries, capitals, mountains, and rivers from around the world.",
    questions: [
      mcq("What is the longest river in the world?", ["Amazon", "Nile", "Yangtze", "Mississippi"], "Nile"),
      mcq("Which country has the largest population?", ["China", "United States", "India", "Indonesia"], "India"),
      mcq("What is the smallest country in the world by area?", ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], "Vatican City"),
      mcq("Which desert is the largest hot desert in the world?", ["Gobi Desert", "Kalahari Desert", "Sahara Desert", "Sonoran Desert"], "Sahara Desert"),
      mcq("Which country is known as the Land of the Rising Sun?", ["China", "Thailand", "Japan", "South Korea"], "Japan"),
      mcq("What is the capital of Australia?", ["Sydney", "Melbourne", "Canberra", "Perth"], "Canberra"),
      mcq("Which mountain range separates Europe and Asia?", ["Alps", "Andes", "Ural Mountains", "Himalayas"], "Ural Mountains"),
      mcq("What is the largest country in the world by area?", ["Canada", "China", "United States", "Russia"], "Russia"),
      mcq("Which African country was formerly known as Abyssinia?", ["Kenya", "Ethiopia", "Sudan", "Somalia"], "Ethiopia"),
      mcq("What is the capital of Canada?", ["Toronto", "Vancouver", "Ottawa", "Montreal"], "Ottawa"),
      mcq("Which sea is the saltiest body of water in the world?", ["Red Sea", "Dead Sea", "Caspian Sea", "Black Sea"], "Dead Sea"),
      mcq("Which country has the most time zones?", ["Russia", "United States", "France", "China"], "France"),
      mcq("What is the capital of Egypt?", ["Alexandria", "Cairo", "Giza", "Luxor"], "Cairo"),
      mcq("Which strait separates Europe from Africa?", ["Strait of Hormuz", "Bering Strait", "Strait of Gibraltar", "Strait of Malacca"], "Strait of Gibraltar"),
      mcq("What is the longest wall ever built by humans?", ["Berlin Wall", "Hadrian's Wall", "Great Wall of China", "Great Zimbabwe Wall"], "Great Wall of China"),
      mcq("Which continent is the Sahara Desert located on?", ["Asia", "Africa", "Australia", "South America"], "Africa"),
    ],
  },

  sport: {
    title: "Sports Trivia",
    description: "Test your knowledge of football, olympics, and more.",
    questions: [
      mcq("How many players are on a soccer team on the field at once?", ["9", "10", "11", "12"], "11"),
      mcq("In which sport would you perform a slam dunk?", ["Volleyball", "Basketball", "Handball", "Netball"], "Basketball"),
      mcq("How often are the Summer Olympic Games held?", ["Every 2 years", "Every 3 years", "Every 4 years", "Every 5 years"], "Every 4 years"),
      mcq("Which country won the first FIFA World Cup in 1930?", ["Brazil", "Argentina", "Uruguay", "Italy"], "Uruguay"),
      mcq("How many holes are there in a standard round of golf?", ["9", "18", "21", "27"], "18"),
      mcq("In tennis, what is a score of zero called?", ["Nil", "Love", "Zero", "Duck"], "Love"),
      mcq("Which country has won the most Cricket World Cups?", ["India", "England", "Australia", "West Indies"], "Australia"),
      mcq("How many players are on a basketball team on the court at once?", ["4", "5", "6", "7"], "5"),
      mcq("What is the maximum possible score in ten-pin bowling?", ["100", "200", "300", "500"], "300"),
      mcq("In which sport is the term \"birdie\" used?", ["Tennis", "Cricket", "Golf", "Badminton"], "Golf"),
      mcq("How many rings are on the Olympic flag?", ["4", "5", "6", "7"], "5"),
      mcq("In American football, how many points is a touchdown worth?", ["3", "5", "6", "7"], "6"),
      mcq("Which country hosted the 2016 Summer Olympics?", ["China", "United Kingdom", "Japan", "Brazil"], "Brazil"),
      mcq("How many periods are there in a standard ice hockey game?", ["2", "3", "4", "5"], "3"),
      mcq("What sport does Lionel Messi play professionally?", ["Basketball", "Football (soccer)", "Tennis", "Rugby"], "Football (soccer)"),
      mcq("In boxing, how many rounds are in a standard professional world title fight?", ["8", "10", "12", "15"], "12"),
    ],
  },

  history: {
    title: "History Trivia",
    description: "From ancient civilizations to the modern era.",
    questions: [
      mcq("In which year did World War II end?", ["1943", "1944", "1945", "1946"], "1945"),
      mcq("Who was the first President of the United States?", ["Thomas Jefferson", "George Washington", "John Adams", "Abraham Lincoln"], "George Washington"),
      mcq("Which ancient civilization built the pyramids of Giza?", ["Ancient Greeks", "Ancient Romans", "Ancient Egyptians", "Mesopotamians"], "Ancient Egyptians"),
      mcq("In which year did the Berlin Wall fall?", ["1987", "1989", "1991", "1993"], "1989"),
      mcq("Who wrote the United States Declaration of Independence?", ["Benjamin Franklin", "Thomas Jefferson", "John Adams", "James Madison"], "Thomas Jefferson"),
      mcq("Julius Caesar was a ruler of which empire?", ["Greek Empire", "Persian Empire", "Roman Empire", "Ottoman Empire"], "Roman Empire"),
      mcq("In which year did the Titanic sink?", ["1905", "1912", "1918", "1923"], "1912"),
      mcq("Who was the first man to walk on the Moon?", ["Buzz Aldrin", "Yuri Gagarin", "Neil Armstrong", "John Glenn"], "Neil Armstrong"),
      mcq("The American Civil War was fought between the Union and which side?", ["The Confederacy", "The Loyalists", "The Colonists", "The Federation"], "The Confederacy"),
      mcq("Who painted the Mona Lisa?", ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"], "Leonardo da Vinci"),
      mcq("In which century did the French Revolution begin?", ["16th century", "17th century", "18th century", "19th century"], "18th century"),
      mcq("Which country gifted the Statue of Liberty to the United States?", ["United Kingdom", "France", "Spain", "Netherlands"], "France"),
      mcq("Who was the leader of Nazi Germany during World War II?", ["Joseph Stalin", "Benito Mussolini", "Adolf Hitler", "Heinrich Himmler"], "Adolf Hitler"),
      mcq("In which year did India gain independence from British rule?", ["1945", "1946", "1947", "1948"], "1947"),
      mcq("Which British monarch reigned for over 70 years, the longest of any British monarch?", ["Queen Victoria", "Queen Elizabeth II", "King George VI", "King Edward VII"], "Queen Elizabeth II"),
      mcq("The Cold War was primarily a standoff between the United States and which country?", ["China", "Soviet Union", "North Korea", "Cuba"], "Soviet Union"),
    ],
  },

  entertainment: {
    title: "Entertainment Trivia",
    description: "Movies, music, and TV shows.",
    questions: [
      mcq("Which movie franchise features a character named Harry Potter?", ["The Chronicles of Narnia", "Harry Potter", "The Lord of the Rings", "Percy Jackson"], "Harry Potter"),
      mcq("Who played Jack Dawson in the movie Titanic?", ["Brad Pitt", "Leonardo DiCaprio", "Tom Cruise", "Matt Damon"], "Leonardo DiCaprio"),
      mcq("Which band released the album \"Abbey Road\"?", ["The Rolling Stones", "The Beatles", "Led Zeppelin", "Pink Floyd"], "The Beatles"),
      mcq("Which streaming service produced the show \"Stranger Things\"?", ["Hulu", "Amazon Prime Video", "Netflix", "Disney+"], "Netflix"),
      mcq("Who is known as the \"King of Pop\"?", ["Elvis Presley", "Prince", "Michael Jackson", "Justin Timberlake"], "Michael Jackson"),
      mcq("Which superhero is also known as the \"Man of Steel\"?", ["Batman", "Superman", "The Flash", "Green Lantern"], "Superman"),
      mcq("In \"Game of Thrones\", what is the name of the fictional continent where most of the story takes place?", ["Essos", "Westeros", "Sothoryos", "Naath"], "Westeros"),
      mcq("Who directed the movies \"Jaws\" and \"E.T.\"?", ["George Lucas", "James Cameron", "Steven Spielberg", "Martin Scorsese"], "Steven Spielberg"),
      mcq("Which Disney animated film features a lion cub named Simba?", ["Tarzan", "The Jungle Book", "The Lion King", "Zootopia"], "The Lion King"),
      mcq("What is the name of Iron Man's alter ego?", ["Bruce Wayne", "Tony Stark", "Steve Rogers", "Peter Parker"], "Tony Stark"),
      mcq("Which singer is known for the song \"Shape of You\"?", ["Ed Sheeran", "Shawn Mendes", "Bruno Mars", "Justin Bieber"], "Ed Sheeran"),
      mcq("In which movie franchise would you find the character Darth Vader?", ["Star Trek", "Star Wars", "Guardians of the Galaxy", "Dune"], "Star Wars"),
      mcq("Which Netflix show is set in the fictional town of Hawkins, Indiana?", ["Ozark", "Stranger Things", "Wednesday", "Dark"], "Stranger Things"),
      mcq("Who wrote the \"Harry Potter\" book series?", ["J.R.R. Tolkien", "J.K. Rowling", "Suzanne Collins", "Rick Riordan"], "J.K. Rowling"),
      mcq("Which actor played the Joker in \"The Dark Knight\" (2008)?", ["Jared Leto", "Joaquin Phoenix", "Heath Ledger", "Jack Nicholson"], "Heath Ledger"),
      mcq("Which animated studio produced \"Toy Story\"?", ["DreamWorks", "Pixar", "Illumination", "Blue Sky Studios"], "Pixar"),
    ],
  },

  science: {
    title: "Science Trivia",
    description: "Physics, biology, chemistry, and space.",
    questions: [
      mcq("What is the chemical symbol for gold?", ["Ag", "Au", "Gd", "Go"], "Au"),
      mcq("Who developed the theory of general relativity?", ["Isaac Newton", "Niels Bohr", "Albert Einstein", "Galileo Galilei"], "Albert Einstein"),
      mcq("What is often called the powerhouse of the cell?", ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"], "Mitochondria"),
      mcq("Which planet is closest to the Sun?", ["Venus", "Earth", "Mercury", "Mars"], "Mercury"),
      mcq("What gas do humans need to breathe to survive?", ["Nitrogen", "Oxygen", "Carbon dioxide", "Hydrogen"], "Oxygen"),
      mcq("Who is credited with formulating the law of universal gravitation?", ["Albert Einstein", "Isaac Newton", "Galileo Galilei", "Nikola Tesla"], "Isaac Newton"),
      mcq("What is the process by which plants make their own food called?", ["Respiration", "Photosynthesis", "Transpiration", "Fermentation"], "Photosynthesis"),
      mcq("What is the chemical symbol for sodium?", ["So", "Sd", "Na", "S"], "Na"),
      mcq("How many bones are there in the adult human body?", ["186", "196", "206", "216"], "206"),
      mcq("What force keeps planets in orbit around the Sun?", ["Magnetism", "Friction", "Gravity", "Inertia"], "Gravity"),
      mcq("What is the smallest unit of matter that retains an element's properties?", ["Molecule", "Atom", "Cell", "Electron"], "Atom"),
      mcq("Which scientist proposed the theory of evolution by natural selection?", ["Gregor Mendel", "Charles Darwin", "Louis Pasteur", "Carl Linnaeus"], "Charles Darwin"),
      mcq("What type of animal is a Komodo dragon?", ["Amphibian", "Mammal", "Reptile", "Fish"], "Reptile"),
      mcq("What is the boiling point of water in Celsius at sea level?", ["90", "95", "100", "110"], "100"),
      mcq("Which vitamin is produced when human skin is exposed to sunlight?", ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin K"], "Vitamin D"),
      mcq("What is the most abundant gas in Earth's atmosphere?", ["Oxygen", "Carbon dioxide", "Nitrogen", "Argon"], "Nitrogen"),
    ],
  },
};

async function seed() {
  await connectMongo();

  for (const [genre, data] of Object.entries(GENRE_QUIZZES)) {
    const quiz = await Quiz.findOneAndUpdate(
      { genre, createdBy: "AI" },
      {
        title: data.title,
        description: data.description,
        genre,
        questions: data.questions,
        createdBy: "AI",
      },
      { upsert: true, new: true }
    );
    console.log(`✅ Seeded "${genre}": ${quiz.questions.length} questions`);
  }

  await mongoose.connection.close();
  console.log("🌱 Seeding complete");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
