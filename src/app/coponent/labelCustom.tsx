import { Typography } from '@mui/material';
import Image from 'next/image';
import React from 'react'

interface Props {
    title?: string;
    text: string;
    name: number | string;
}

export default function LabelCustom(props: Props) {
    return (
        <>
            {props.title ? <div className='flex font-sans pb-3'>
                <input hidden value={props.text} name={props.name.toString()} />
                <Typography fontSize="13px"  >
                    {props.title}:
                </Typography>
                <Typography fontWeight="bold"
            fontSize="13px" className='mr-2 font-bold'>
                    {props.text}
                </Typography>
            </div> :
                <div className='font-sans pb-3 flex items-center'>
                    <Image src="/icons/Ellipse.svg" alt="Home" width={10} height={10} />
                    <Typography fontWeight="bold"
            fontSize="13px" className='font-bold mr-2'>
                        {props.text}
                    </Typography>
                </div>
            }
        </>
    )

}
