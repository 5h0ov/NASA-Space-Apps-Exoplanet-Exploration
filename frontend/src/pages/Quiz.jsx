import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import CryptoJS from "crypto-js";
import Pagination from "../components/Pagination.jsx";
import "./Quiz.scss"; // Import the SASS file for advanced animations

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;
const API_URL = import.meta.env.VITE_BACKEND_URL;

const Quiz = () => {
  const { planetName } = useParams();
  const [quizData, setQuizData] = useState(null);
  const [multiplePlanets, setMultiplePlanets] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 15;

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${API_URL}/api/quiz/${planetName}?page=${currentPage}`
        );
        console.log("Quiz data:", response.data);

        const response1 = await axios.get(
          `https://science.nasa.gov/wp-json/smd/v1/content-list/?requesting_id=199043&post_types=exoplanet&categories&internal_terms&mission_status&mission_type&mission_target&mission_programs&news_tags&meta_fields=%7B%7D&exclude_child_pages=false&order=DESC&orderby=date&science_only=false&search_query=${planetName}&paged=1&number_of_items=10000&layout=grid&listing_page_category_id=0`
        );
        const totalCount = response1.data.value.pagination.found_posts;
        setTotalPages(Math.ceil(totalCount / itemsPerPage));
        console.log("Total Planets found:", totalCount);

        if (response.data.planets) {
          setMultiplePlanets(response.data.planets);
        } else {
          // console.log('Decrypted Data:', response.data.data);

          const bytes = CryptoJS.AES.decrypt(response.data.data, SECRET_KEY);
          const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
          console.log("Decrypted Data:", decryptedData);
          const dataToCheck =
            decryptedData.exactMatch || decryptedData.quizData;
          const hash = CryptoJS.SHA256(JSON.stringify(dataToCheck)).toString();

          if (hash === decryptedData.hash) {
            setQuizData(dataToCheck);
          } else {
            console.error("Data integrity check failed");
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        setIsLoading(false);
      }
    };

    fetchQuizData();
  }, [planetName, currentPage]);

  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };
  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
    window.scroll({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    setQuizData(null);
    setMultiplePlanets([]);
    setCurrentQuestion(0);
    setScore(0);
  }, [planetName]);

  const handlePlanetSelection = (selectedPlanet) => {
    navigate(`/quiz/${selectedPlanet}`);
  };

  const handleAnswer = (isCorrect) => {
    if (isCorrect) {
      setScore(score + 1);
    }
    setCurrentQuestion(currentQuestion + 1);
  };

  if (multiplePlanets.length > 0) {
    return (
      <>
        <div className="video-wrapper">
          <video src="/quizbg.mp4" autoPlay muted loop></video>
        </div>
        <div className="min-h-screen flex flex-col items-center justify-center text-white">
          <h1 className="text-4xl bg-slate-700/80 p-4">Typed Wrong?</h1>
          <Link to="/quiz" className="p-4 mb-10">
            <button className="bg-slate-600 hover:bg-slate-700 text-white text-2xl font-bold py-4 px-6 rounded">
              Go back to Quiz Selection Page
            </button>
          </Link>
          <div className="bg-slate-900 p-10 h-full border border-white rounded-lg">
            <h1 className="text-3xl mb-4">
              Multiple planets found, please select one:
            </h1>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              isMobile={isMobile}
              handlePageChange={handlePageChange}
              isLoading={isLoading}
              searchQuery={null}
              itemsPerPage={itemsPerPage}
            />

            {isLoading ? (
              <div className="text-xl">Loading Planet Entries...</div>
            ) : (
              <ul className="flex flex-wrap gap-4 p-4">
                {multiplePlanets.map((planet) => (
                  <li key={planet.id}>
                    <button
                      className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded"
                      onClick={() => handlePlanetSelection(planet.title)}
                    >
                      {planet.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              isMobile={isMobile}
              handlePageChange={handlePageChange}
              isLoading={isLoading}
              searchQuery={null}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </div>
      </>
    );
  }

  if (!quizData) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  const questions = [
    {
      questionText: `What is the distance of ${quizData.title} from Earth?`,
      options: [
        { optionText: quizData.customFields.st_dist.value, isCorrect: true },
        { optionText: "1000 parsecs", isCorrect: false },
        { optionText: "500 parsecs", isCorrect: false },
        { optionText: "2000 parsecs", isCorrect: false },
      ],
    },
    {
      questionText: `What is the mass of ${quizData.title}?`,
      options: [
        {
          optionText: quizData.customFields.planet_mass.value,
          isCorrect: true,
        },
        { optionText: "10 Earth Masses", isCorrect: false },
        { optionText: "5 Earth Masses", isCorrect: false },
        { optionText: "15 Earth Masses", isCorrect: false },
      ],
    },
    {
      questionText: `When was ${quizData.title} discovered?`,
      options: [
        {
          optionText: quizData.customFields.discovery_date.value,
          isCorrect: true,
        },
        { optionText: "2000", isCorrect: false },
        { optionText: "2010", isCorrect: false },
        { optionText: "1995", isCorrect: false },
      ],
    },
  ];

  if (currentQuestion >= questions.length) {
    return (
      <>
        <div className="video-wrapper">
          <video src="/quizbg.mp4" autoPlay muted loop></video>
        </div>
        <div className="flex flex-col items-center justify-center text-white bg-slate-900 my-60 w-[40vw]  p-32 mx-auto border border-white rounded-lg font-krona text-3xl">
          Your score: {score}/{questions.length}
          <Link to="/quiz" className="p-4 mt-10">
            <button className="bg-slate-600 hover:bg-slate-700 text-white text-2xl font-bold py-4 px-6 rounded">
              Go back
            </button>
          </Link>
        </div>
      </>
    );
  }

  const question = questions[currentQuestion];

  return (
    <>
      <div className="video-wrapper">
        <video src="/quizbg.mp4" autoPlay muted loop></video>
      </div>
      <div className="flex flex-col items-center justify-center text-white bg-slate-900 my-36 sm:w-[30vw] w-[90vw] p-10 mx-auto border border-white rounded-lg">
        <h1 className="sm:text-4xl text-2xl mb-6 font-krona typewriter-text">
          {quizData.title} Quiz
        </h1>
        <div className="w-full max-w-md ">
          <h2 className="text-base mb-4 font-krona">{question.questionText}</h2>
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <button
                key={index}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded transition-all duration-300"
                onClick={() => handleAnswer(option.isCorrect)}
              >
                {option.optionText}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Quiz;
