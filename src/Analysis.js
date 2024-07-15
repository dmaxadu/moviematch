import React, { useState, useEffect } from 'react';
import { FaHeart, FaHeartBroken } from 'react-icons/fa';
import { GoArrowSwitch } from "react-icons/go";
import axios from 'axios';
import PCA from 'pca-js';
import './App.css';
import Recommendations from './Recommendations';

function Analysis() {
  const [movies, setMovies] = useState([]);
  const [watched, setWatched] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [end, setEnd] = useState(10);
  const [recommendations, setRecommendations] = useState([]);
  const [movie, setMovie] = useState(false);
  const [movieIndex, setMovieIndex] = useState(0);
  const [showRecommendation, setShowRecommendation] = useState(false);

  useEffect(() => {
    fetchMovies();
  }, []);

  function shuffle(array) {
    let currentIndex = array.length;
    while (currentIndex !== 0) {
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
  }

  const fetchMovies = () => {
    fetch('./new_movies.json', {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        const array = data.movies;
        shuffle(array);
        setMovies(array);
        setMovie(array[0]);
        console.log(array[0])
      })
      .then(()=>{
      });
  };

  const handleWatched = (id, multiplier) => {
    const currentMovie = movies.find(movie => movie.id === id);
    const updatedWatched = [...watched, id];
    const updatedMatrix = [...matrix, currentMovie.genre_vector.map(value => multiplier * value)];
    
    setWatched(updatedWatched);
    setMatrix(updatedMatrix);
    setMovies(prevMovies => prevMovies.filter(movie => movie.id !== id));
    console.log(updatedMatrix);
    const index = movieIndex + 1;
    setMovieIndex(index);
    setMovie(movies[index])
    if (updatedMatrix.length === 10 || index === movies.length) {
      applyPCA(updatedMatrix);
      setShowRecommendation(true);
    }
  };

  const handleUpdate = () => {
    const index = movieIndex + 1;
    setMovieIndex(index);
    setMovie(movies[index])
  };

  const applyPCA = (matrix) => {
    const vectors = PCA.getEigenVectors(matrix);
    const mainVector = vectors[0].vector;
    recommendMovies(mainVector, matrix);
  };

  const cosineSimilarity = (vecA, vecB) => {
    const dotProduct = vecA.reduce((acc, val, index) => acc + val * vecB[index], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  };

  const recommendMovies = (mainVector, watched) => {
    const recommendations = movies
      .filter(movie => !watched.includes(movie.id)) // Filmes não assistidos
      .map(movie => ({
        ...movie,
        score: cosineSimilarity(movie.genre_vector, mainVector) // Calcular a similaridade do cosseno
      }))
      .sort((a, b) => b.score - a.score) // Ordenar por score em ordem decrescente
      .slice(0, 10); // Selecionar os top 10

    setRecommendations(recommendations);
  };

  return (
    <div className="tinder-like">
        <h3 className="page-title" onClick={()=> window.location.reload()}>moviematch</h3>
        {movie && watched.length < 10 && (<div key={movie.id} className="movie-card">
            <div className="card-wrapper">
                <div className="background"/>
                <img src={`https://image.tmdb.org/t/p/original${movie.poster_path}`} alt={movie.title} className="movie-poster" />
                <div className="movie-infos">
                    <h3 className="movie-title">{movie.title}</h3>
                    <div className="button-group">
                        <button onClick={() => handleWatched(movie.id, 1)} className="like-button"><FaHeart /></button>
                        <button onClick={() => handleUpdate()} className="jump-button"><GoArrowSwitch /></button>
                        <button onClick={() => handleWatched(movie.id, -1)} className="dislike-button"><FaHeartBroken /></button>
                    </div>
                </div>
          </div>
        </div>)}
      {showRecommendation && <div className="recommendations">
        <h3 className="recommendations-title">Recomendações</h3>
        <div className="recommendation-grid">
            {recommendations.map(movie => (
            <div key={movie.id} className="movie-recommendation-wrapper">
                <div className="movie-recommendation">
                    <img src={`https://image.tmdb.org/t/p/original${movie.poster_path}`} alt={movie.title} className="movie-recommendation-poster"/>
                </div>
            </div>
            ))}
        </div>
      </div>}
    </div>
  );
}

export default Analysis;
