"use client";

function Logo() {
  return (
    <div className="logoBox">
      <svg width="34" height="34" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e"/>
            <stop offset="100%" stopColor="#16a34a"/>
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r="45" fill="url(#logoGrad)" />

        <path
          d="M30 55 Q40 30 50 50 Q60 70 70 45"
          stroke="white"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      <span className="logoText">MyChatScore</span>
    </div>
  );
}

export default function LegalLayout({children}:{children:React.ReactNode}){

return(

<main>

<header className="navbar">

<Logo/>

<button
className="aviButton"
onClick={()=>window.location.href="/"}
>
Avi
</button>

</header>

<section className="legalSection">

<div className="legalCard">

{children}

</div>

</section>

</main>

)

}
