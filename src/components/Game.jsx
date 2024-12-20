import { memo, useEffect, useRef } from 'react';
import { Bodies, Body, Engine, Events, Render, Runner, World } from 'matter-js';
import { FRUITS_BASE } from '../constants/fruits.js'; // FRUITS_HLW 제거
import { COLLISION_MAX_X, COLLISION_MIN_X, GAME_OPTION, GAME_WIDTH, WORLD_OPTION } from '../constants/option.js';
import { useSetRecoilState } from 'recoil';
import { scoreState } from '../stores/Game';

const Game = memo(({ theme }) => {
    const setScoreState = useSetRecoilState(scoreState);
    const containerRef = useRef();
    const canvasRef = useRef();

    // 테마 상관 없이 FRUITS_BASE만 사용
    const FRUITS = FRUITS_BASE;

    const engine = Engine.create();
    const world = engine.world;
    World.add(world, WORLD_OPTION);

    let disableAction = false;
    let currentBody = null;
    let currentFruit = null;
    let interval = null;

    const addFruit = (isFirst = true) => {
        const index = Math.floor(Math.random() * (FRUITS_BASE.length / 2));
        const fruit = FRUITS[index];
        const body = Bodies.circle(GAME_WIDTH / 2, 70, fruit.radius, {
            index: index,
            isSleeping: true,
            render: {
                sprite: {
                    texture: `${theme}/${fruit.name}.png`
                },
            },
            restitution: 0.2,
        });

        currentBody = body;
        currentFruit = fruit;
        World.add(world, body);
        if (isFirst === true) {
            setScoreState((score) => score + 50);
        }
    };

    useEffect(() => {
        const render = Render.create({
            engine,
            element: containerRef.current,
            canvas: canvasRef.current,
            options: GAME_OPTION,
        });

        Render.run(render);
        Runner.run(engine);

        return () => {
            Render.stop(render);
            Engine.clear(engine);
        };
    }, [engine]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (disableAction) return;

            switch (event.code) {
                case 'KeyA':
                case 'ArrowLeft':
                    if (interval) return;
                    interval = setInterval(() => {
                        if (currentBody.position.x - currentFruit.radius > COLLISION_MIN_X) {
                            Body.setPosition(currentBody, {
                                x: currentBody.position.x - 1,
                                y: currentBody.position.y,
                            });
                        }
                    }, 5);
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    if (interval) return;
                    interval = setInterval(() => {
                        if (currentBody.position.x + currentFruit.radius < COLLISION_MAX_X) {
                            Body.setPosition(currentBody, {
                                x: currentBody.position.x + 1,
                                y: currentBody.position.y,
                            });
                        }
                    }, 5);
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    currentBody.isSleeping = false;
                    disableAction = true;
                    setTimeout(() => {
                        addFruit();
                        disableAction = false;
                    }, 1000);
                    break;
            }
        };

        const handleKeyUp = (event) => {
            switch (event.code) {
                case 'KeyA':
                case 'KeyD':
                case 'ArrowLeft':
                case 'ArrowRight':
                    clearInterval(interval);
                    interval = null;
                    break;
            }
        };

        const handleCollision = (event) => {
            event.pairs.forEach((collision) => {
                if (collision.bodyA.index === collision.bodyB.index) {
                    const index = collision.bodyA.index;

                    if (index === FRUITS.length - 1) return;

                    World.remove(world, [collision.bodyA, collision.bodyB]);
                    const newFruit = FRUITS[index + 1];
                    const newBody = Bodies.circle(
                        collision.collision.supports[0].x,
                        collision.collision.supports[0].y,
                        newFruit.radius, {
                        render: {
                            sprite: {
                                texture: `${theme}/${newFruit.name}.png`
                            },
                        },
                        index: index + 1,
                    }
                    );
                    World.add(world, newBody);
                    setScoreState((score) => score + index * 100);
                }

                if (!disableAction && (collision.bodyA.name === 'topLine' || collision.bodyB.name === 'topLine')) {
                    alert('Game over');
                    disableAction = true;
                }
            });
        };

        addFruit(false);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        Events.on(engine, 'collisionStart', handleCollision);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            Events.off(engine, 'collisionStart', handleCollision);
        };
    }, [disableAction, interval, currentBody, currentFruit, FRUITS, world, engine]);

    return (
        <section ref={containerRef}>
            <canvas ref={canvasRef} />
        </section>
    );
});

export default Game;
