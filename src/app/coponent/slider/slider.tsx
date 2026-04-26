'use client'


// pages/index.js
import { useState, useEffect } from 'react';
import "./style.css"
import Image from 'next/image';
import Image1 from './../../../../public/pic/img1.jpg';
import Image2 from './../../../../public/pic/img2.jpg';
import Image3 from './../../../../public/pic/img3.jpg';
export default function Slider() {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const checkNext = () => {
        const labels = document.querySelectorAll('#slider label');
        const nextIndex = selectedIndex === labels.length - 1 ? 0 : selectedIndex + 1;
        setSelectedIndex(nextIndex);
    };

    const check = (index) => setSelectedIndex(index);

    // Ensure this runs only on the client (avoid issues with SSR)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Safe to access document here
        }
    }, []);

    return (
        <div className='sliderParent'>

            <div className="md:w-4/4 md:mb-0 mb-6 flex flex-col text-center items-center">
                <section
                    id="slider"
                    className="w-16 h-20 inline-flex items-center justify-center mb-5 flex-shrink-0"
                >
                    <input
                        type="radio"
                        name="slider"
                        id="s1"
                        checked={selectedIndex === 0}
                        onChange={() => check(0)}
                    />
                    <input
                        type="radio"
                        name="slider"
                        id="s2"
                        checked={selectedIndex === 1}
                        onChange={() => check(1)}
                    />
                    <input
                        type="radio"
                        name="slider"
                        id="s3"
                        checked={selectedIndex === 2}
                        onChange={() => check(2)}
                    />
                    <label htmlFor="s1" id="slide1">
                        <Image src={Image1} alt="Image1" height={300} width={300} />
                    </label>
                    <label htmlFor="s2" id="slide2">
                        <Image src={Image2} alt="Image2" height={300} width={300} />
                    </label>
                    <label htmlFor="s3" id="slide3">
                        <Image src={Image3} alt="Image3" height={300} width={300} />
                    </label>
                </section>
            </div>

        </div>
    );
}
