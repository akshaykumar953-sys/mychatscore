"use client";
import Logo from "./Logo";

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
