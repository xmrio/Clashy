import React from 'react'

import './title-bar.css'

type Props = {
    title: string
}

function titleBar(props: Props) {
    return (
        <div className='title-bar-wrapper' >
            <p>{props.title}</p>
        </div>
    )
}

export const TitleBar = titleBar